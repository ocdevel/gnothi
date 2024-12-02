import {Base} from './base'
import {eq, and, sql} from 'drizzle-orm'
import {notifsShares, notifsGroups, notifsNotes} from '../schemas/notifs'
import {users} from '../schemas/users'
import {shares, sharesUsers} from '../schemas/shares'
import {groups} from '../schemas/groups'
import {entries} from '../schemas/entries'
import {entriesTags} from '../schemas/entriesTags.js'
import {sharesTags} from '../schemas/shares'

export class Notifs extends Base {
  async getShareNotifs() {
    const {vid, db: {drizzle}} = this.context
    return await drizzle
      .select({
        user_id: notifsShares.user_id,
        obj_id: notifsShares.obj_id,
        count: notifsShares.count,
        last_seen: notifsShares.last_seen,
      })
      .from(notifsShares)
      .where(eq(notifsShares.user_id, vid))
  }

  async getGroupNotifs() {
    const {vid, db: {drizzle}} = this.context
    return await drizzle
      .select({
        user_id: notifsGroups.user_id,
        obj_id: notifsGroups.obj_id,
        count: notifsGroups.count,
        last_seen: notifsGroups.last_seen,
      })
      .from(notifsGroups)
      .where(eq(notifsGroups.user_id, vid))
  }

  async getNoteNotifs() {
    const {vid, db: {drizzle}} = this.context
    return await drizzle
      .select({
        user_id: notifsNotes.user_id,
        obj_id: notifsNotes.obj_id,
        count: notifsNotes.count,
        last_seen: notifsNotes.last_seen,
      })
      .from(notifsNotes)
      .where(eq(notifsNotes.user_id, vid))
  }

  async seenShare(shareId: string) {
    const {vid, db: {drizzle}} = this.context
    await drizzle
      .update(notifsShares)
      .set({ count: 0 })
      .where(and(
        eq(notifsShares.user_id, vid),
        eq(notifsShares.obj_id, shareId)
      ))
  }

  async seenGroup(groupId: string) {
    const {vid, db: {drizzle}} = this.context
    await drizzle
      .update(notifsGroups)
      .set({ count: 0 })
      .where(and(
        eq(notifsGroups.user_id, vid),
        eq(notifsGroups.obj_id, groupId)
      ))
  }

  async seenNote(noteId: string) {
    const {vid, db: {drizzle}} = this.context
    await drizzle
      .update(notifsNotes)
      .set({ count: 0 })
      .where(and(
        eq(notifsNotes.user_id, vid),
        eq(notifsNotes.obj_id, noteId)
      ))
  }

  async incrementShareNotif(shareId: string, userId: string) {
    const {db: {drizzle}} = this.context
    await drizzle
      .insert(notifsShares)
      .values({
        user_id: userId,
        obj_id: shareId,
        count: 1,
      })
      .onConflictDoUpdate({
        target: [notifsShares.user_id, notifsShares.obj_id],
        set: {
          count: notifsShares.count + 1,
          last_seen: new Date(),
        },
      })
  }

  async incrementGroupNotif(groupId: string, userId: string) {
    const {db: {drizzle}} = this.context
    await drizzle
      .insert(notifsGroups)
      .values({
        user_id: userId,
        obj_id: groupId,
        count: 1,
      })
      .onConflictDoUpdate({
        target: [notifsGroups.user_id, notifsGroups.obj_id],
        set: {
          count: notifsGroups.count + 1,
          last_seen: new Date(),
        },
      })
  }

  async incrementNoteNotif(noteId: string, userId: string) {
    const {db: {drizzle}} = this.context
    await drizzle
      .insert(notifsNotes)
      .values({
        user_id: userId,
        obj_id: noteId,
        count: 1,
      })
      .onConflictDoUpdate({
        target: [notifsNotes.user_id, notifsNotes.obj_id],
        set: {
          count: notifsNotes.count + 1,
          last_seen: new Date(),
        },
      })
  }

  // When a share is created, notify the user being shared with
  async createShareNotif(shareId: string, userId: string) {
    const {db: {drizzle}} = this.context
    await drizzle
      .insert(notifsShares)
      .values({
        user_id: userId,
        obj_id: shareId,
        count: 1,
      })
      .onConflictDoUpdate({
        target: [notifsShares.user_id, notifsShares.obj_id],
        set: {
          count: notifsShares.count + 1,
          last_seen: new Date(),
        },
      })
  }

  // When a new entry is created, notify all users who have access via shares
  async createEntryNotifs(entryId: string, tagIds: string[]) {
    const {vid, db: {drizzle}} = this.context

    // Find all users who have access to this entry via shared tags
    const usersToNotify = await drizzle
      .select({
        userId: sharesUsers.obj_id,
      })
      .from(entriesTags)
      .innerJoin(sharesTags, eq(entriesTags.tag_id, sharesTags.obj_id))
      .innerJoin(sharesUsers, eq(sharesTags.share_id, sharesUsers.share_id))
      .where(and(
        eq(entriesTags.entry_id, entryId),
        sql`${entriesTags.tag_id} = ANY(${tagIds})`
      ))
      .groupBy(sharesUsers.obj_id)

    // Create notifications for each user
    for (const {userId} of usersToNotify) {
      if (userId === vid) continue // Don't notify self
      await drizzle
        .insert(notifsNotes)
        .values({
          user_id: userId,
          obj_id: entryId,
          count: 1,
        })
        .onConflictDoUpdate({
          target: [notifsNotes.user_id, notifsNotes.obj_id],
          set: {
            count: notifsNotes.count + 1,
            last_seen: new Date(),
          },
        })
    }
  }
}
