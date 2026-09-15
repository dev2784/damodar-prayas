# Matrimony moderation flow

Current MVP moderation rules:

- Draft and rejected profiles can be edited and deleted directly by their owner.
- Approved profiles can be edited by their owner; saving changes moves the profile back to pending review.
- Pending and approved profiles cannot be deleted directly by the owner.
- Owners submit a deletion request with a required reason; the profile remains available according to its current status until an admin reviews that request.
- Admin approval/rejection UI will be implemented in the future admin panel. Until then, moderation can be performed directly in the database for development/testing.
