# Current Sprint Tasks

## EMO-001: Implement Create User Emotion API

Status: To Do
Priority: High
Dependencies: None

### Requirements

- User create an emotion log
- Require USER role
- Emotion is one of ['joy', 'sadness', 'anger', 'fear', 'joker']
- In case there is an emotion at same hour in day
  - if emotion is difference, replace it by new emotion
  - if emotion is same, increment intensity util 5

### Acceptance Criteria

1. Users create emotions many time
2. Users receive successfully response
3. Do not have duplicate emotion in same hour for 1 user (loose condition)

### Technical Notes

- Add this API into gamification module
- Add OpenAPI docs in controller
- Follow Error handle from technical.md
- Follow code style from src/identity/presentation/rest/user.controller.ts
