import re, os
import pandas as pd
from textacy import preprocessing
from sqlalchemy import create_engine, text
from bs4 import BeautifulSoup
import html

def html2txt(s):
    # s = UnicodeDammit.detwingle(s.encode()).decode()
    s = html.unescape(s)  # is this necessary?
    return BeautifulSoup(s, "html5lib").text

def only_ascii(s):
    return re.sub(r"[^\x00-\x7F\xA9]+", "", s)


cleanup = preprocessing.make_pipeline(
    html2txt,
    preprocessing.replace.urls,
    preprocessing.replace.emails,
    preprocessing.replace.phone_numbers,
    only_ascii,
    preprocessing.normalize.whitespace
)

def mysql_to_df():
    engine = create_engine("mysql+pymysql://root:password@localhost:3306/books?charset=utf8mb4", echo=True, future=True)
    with engine.connect() as conn:
        sql = text(f"""
        select u.ID, u.Title, u.Author, d.descr, t.topic_descr
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
    return df.rename(columns=dict(
        ID='id',
        descr='content',
        Title='name',
        Author='author',
        topic_descr='genre',
    ))

def clean_df(df):
    print(f"n_books before cleanup {df.shape[0]}")
    print("Remove HTML")

    # some books are literally just ########
    df = df[~(df.name + df.content).str.contains('(\?\?\?|\#\#\#)')]

    df['content'] = df.content.apply(cleanup)
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
df.to_pickle("books/db/df.pkl")
