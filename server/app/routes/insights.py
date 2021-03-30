import pdb, time
from typing import List, Dict, Any
from pydantic import parse_obj_as
import common.pydantic.insights as PyI
from common.pydantic.ws import MessageOut
from common.pydantic.utils import BM, BM_ORM, BM_ID
from common.errors import CantSnoop, NotFound, AIOffline, GnothiException

from common.database import with_db
import common.models as M


def submit_job(d, method, data):
    # AI offline (it's spinning up from views.py->cloud_updown.py)
    status = M.Machine.gpu_status(d.db)
    if status == 'off':
        raise AIOffline()

    jid = M.Job.create_job(d.db, d.vid, method=method, data_in=data)
    if not jid: return {}
    return dict(
        id=jid,
        queue=M.Job.place_in_queue(d.db, jid)
    )


class Insights:
    @staticmethod
    async def on_influencers_get(data: BM, d) -> Dict:
        if d.snooping and not d.user.share_data.fields:
            raise CantSnoop('fields')
        rows = d.db.query(M.Influencer) \
            .join(M.Field, M.Field.id == M.Influencer.influencer_id) \
            .filter(M.Field.user_id == d.uid).all()
        obj = {}
        for r in rows:
            fid, iid = str(r.field_id), str(r.influencer_id)
            if fid not in obj:
                obj[fid] = {}
            obj[fid][iid] = r.score
        return obj

    @staticmethod
    async def _job_done(mgr, jid):
        # TODO handle give-up after 10minutes
        with with_db() as db:
            jobq = db.query(M.Job).filter_by(id=jid)
            job = jobq.first()
            if job.user_id:
                action = {
                    'summarization': 'insights/summarize/get',
                    'question-answering': 'insights/question/get',
                    'themes': 'insights/themes/get'
                }[job.method]
                out = dict(action=action, data=job.data_out)
                out = parse_obj_as(MessageOut, out)
                await mgr.send(out, uids=[job.user_id])
            jobq.delete()
            db.commit()

    @staticmethod
    async def on_themes_post(data: PyI.ThemesPost, d) -> PyI.JobSubmitGet:
        entries = M.Entry.snoop(
            d.db,
            d.vid,
            d.uid,
            days=data.days,
            tags=data.tags,
            for_ai=True
        )
        eids = [str(e.id) for e in entries.all()]

        # For dreams, special handle: process every sentence. TODO make note in UI
        # tags = request.get_json().get('tags', None)
        # if tags and len(tags) == 1:
        #     tag_name = Tag.query.get(tags[0]).name
        #     if re.match('dream(s|ing)?', tag_name, re.IGNORECASE):
        #         entries = [s.text for e in entries for s in e.sents]

        if len(eids) < 2:
            raise GnothiException(400, "INSUFFICIENT", "Not enough entries to work with, come back later")
        return submit_job(d, 'themes', dict(args=[eids], kwargs={'algo': data.algo}))

    @staticmethod
    async def on_question_post(data: PyI.QuestionPost, d) -> PyI.JobSubmitGet:
        # background_tasks.add_task(ga, viewer.id, 'feature', 'ask')
        question = data.question
        context = M.Entry.snoop(
            d.db,
            d.vid,
            d.uid,
            days=data.days,
            tags=data.tags,
            for_ai=True
        )

        w_profile = (not d.snooping) or d.user.share_data.profile
        profile_id = d.uid if w_profile else None
        context = M.CacheEntry.get_paras(d.db, context, profile_id=profile_id)

        return submit_job(d, 'question-answering', dict(args=[question, context]))

    @staticmethod
    async def on_summarize_post(data: PyI.SummarizePost, d) -> PyI.JobSubmitGet:
        # background_tasks.add_task(ga, viewer.id, 'feature', 'summarize')
        entries = M.Entry.snoop(
            d.db,
            d.vid,
            d.uid,
            days=data.days,
            tags=data.tags,
            for_ai=True
        )
        entries = M.CacheEntry.get_paras(d.db, entries)

        min_ = int(data.words / 2)
        kwargs = dict(min_length=min_, max_length=data.words)
        return submit_job(d, 'summarization', dict(args=[entries], kwargs=kwargs))

    @staticmethod
    async def on_books_post(data: PyI.ShelfPost, d):
        # background_tasks.add_task(ga, viewer.id, 'bookshelf', shelf)
        if d.snooping and not d.user.share_data.books:
            raise CantSnoop()
        shelf = 'recommend' if d.snooping else data.shelf
        M.Bookshelf.upsert(d.db, d.uid, data.id, shelf)
        # await d.mgr.send_other('insights/books/get', data, d)

    @staticmethod
    async def on_books_get(data: PyI.ShelfGet, d) -> List[PyI.BookOut]:
        if d.snooping and not d.user.share_data.books:
            raise CantSnoop('books')
        return M.Bookshelf.get_shelf(d.db, d.uid, data.shelf)

    @staticmethod
    async def on_top_books_get(data: BM, d) -> List[PyI.TopBooksOut]:
        return M.Bookshelf.top_books(d.db)
