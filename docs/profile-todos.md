# Profile / Edit Profile, deferred TODOs
# Profile / Edit Profile, deferred TODOs

Items raised during the profile + edit-profile review (2026-05-31) that we
chose not to ship in this pass. Listed in roughly the suggested priority order.

## 3. Share / copy-link affordance

A way for the user to send their profile URL (or `@username`) to a friend so
they can add them. Could live as a button next to "Edit profile" on the user
page, e.g. "Copy profile link" using the Clipboard API.

## 4. Friend status CTA on other users' profiles

Once `/profile/:username` (or similar) renders someone else's profile, the
slot currently used by "Edit profile" needs to flip to "Add friend",
"Pending", or "Friends" depending on the friendship state. Backend already
has the `Friendship` model and `ACCEPTED` status.

## 6. Change password section in Edit profile

Move the password change flow out of the forgot-password email loop for
signed-in users. Add a "Security" section to Edit profile with
`currentPassword` and `newPassword` fields. Backend endpoint to add:
`POST /api/auth/change-password` that bcrypt-compares the current password
and rotates sessions on success (mirror what `/reset-password` does).

## 7. Connected accounts management

Surface `hasGoogleLink` / `hasAppleLink` in Edit profile. For Google: a
"Connect with Google" button that triggers the existing
`POST /api/auth/link-google` endpoint, and an "Unlink" action (needs a new
backend endpoint with the same step-up password check). Apple is currently
gated by `APPLE_SIGNIN_ENABLED`, so the UI should hide that row when the
flag is off.

## 9. Delete account / danger zone

Standard "Danger zone" card at the bottom of Edit profile. Needs a new
backend endpoint, decision on soft-delete vs. hard-delete, and a
confirmation modal that requires re-entering the password or typing the
username. Plant images on Cloudinary should be queued for cleanup.

## 10. Orphaned Cloudinary uploads on Cancel

If the user uploads a new avatar or banner and then clicks Cancel, the file
stays on Cloudinary. Options: (a) call Cloudinary's `destroy` API on cancel
for any URL that doesn't match what was saved, (b) accept the leak and run
a periodic cleanup job that compares Cloudinary public IDs against
`users.avatarUrl` / `users.bannerUrl`.

## 11. Email verification nudge

If `user.emailVerified === false`, Edit profile should surface a yellow
banner with "Verify your email" + a button that hits the existing
`POST /api/auth/resend-verification` (or whatever the endpoint is). Today
this state is invisible to the user once they're signed in.
