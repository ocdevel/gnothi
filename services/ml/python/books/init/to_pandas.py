import re, os
from common.env import VECTORS_PATH
from preprocess.clean import CleanText
import pandas as pd
from sqlalchemy import create_engine, text
import pyarrow.feather as feather
from bs4 import BeautifulSoup
import html

books_dir = f"{VECTORS_PATH}/books"
books_file = f"{books_dir}/meta.feather"
os.makedirs(books_dir, exist_ok=True)

def html2txt(s):
    # s = UnicodeDammit.detwingle(s.encode()).decode()
    s = html.unescape(s)  # is this necessary?
    return BeautifulSoup(s, "html5lib").text

def only_ascii(s):
    return re.sub(r"[^\x00-\x7F\xA9]+", "", s)


def cleanup(s):
    return (CleanText([s]).strip_html()
            .only_ascii()
            .multiple_whitespace())

def mysql_to_df():
    engine = create_engine("mysql+pymysql://root:password@localhost:3306/books?charset=utf8mb4", echo=True, future=True)
    with engine.connect() as conn:
        sql = text(f"""
        select 
            u.ID AS id, 
            u.Title AS name, 
            u.Author AS author, 
            d.descr AS content, 
            t.topic_descr AS genre, 
            u.IdentifierWODash AS isbn
        from updated u
            inner join description d on d.md5=u.MD5
            inner join topics t on u.Topic=t.topic_id
                -- later more languages; but I think it's only Russian in Libgen?
                and t.lang='en'
        where u.Language = 'English'
            -- Make sure there's some content to work with
            and length(d.descr) > 200 and length(u.Title) > 1
        """)
        df = pd.read_sql(sql, conn)

    # Define the function to extract the first 10-digit ISBN
    def extract_first_10_digit_isbn(identifier):
        # Simple pattern for a 10-digit number
        pattern = r'\b\d{10}\b'
        # Find all matches in the identifier string
        matches = re.findall(pattern, identifier)
        # Return the first 10-digit match, or None if there's no match
        return matches[0] if matches else None

    # Apply the function to create a new column with the extracted 10-digit ISBN
    df['isbn'] = df['isbn'].apply(extract_first_10_digit_isbn)
    return df

def clean_df(df):
    print(f"n_books before cleanup {df.shape[0]}")
    print("Remove HTML")

    # some books are literally just ########
    df = df[~(df.name + df.content).str.contains('(\?\?\?|\#\#\#)')]

    df['content'] = df.content.apply(lambda x: cleanup(x).value())
    df['txt_len'] = df.content.str.len()
    # Ensure has content. Drop dupes, keeping those w longest description
    df = df[df.txt_len > 150]\
        .sort_values('txt_len', ascending=False)\
        .drop_duplicates('id')\
        .drop_duplicates(['name', 'author'])\
        .drop(columns=['txt_len'])
    # books = books[books.clean.apply(lambda x: detect(x) == 'en')]
    print(f"n_books after cleanup {df.shape[0]}")
    return df

df = mysql_to_df()
df = clean_df(df)
feather.write_feather(df, books_file)
