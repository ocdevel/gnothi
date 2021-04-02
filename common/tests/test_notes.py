import pytest, pdb
from box import Box
import common.database as D
import common.models as M


@pytest.mark.parametrize("data", [
    # Box(text="note"),  # test uses defaults
    Box(type=M.NoteTypes.comment, private=False, text="note")
])
def test_notes_solo(data, u, db):
    entry = M.Entry(user=u.user1, text="entry")
    db.add(entry)
    db.commit()
    db.refresh(entry)
    data['entry_id'] = entry.id
    notifs = M.Note.add_note(db, u.user1.id, data)
    db.refresh(entry)
    assert entry.n_notes == 1
    assert len(notifs) == 1



def test_notes_multi(data, u, db):
    # user1->user2 share, user3:solo
    # assert user1, user2 got notifs; user3 nothing
    pass
