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
- Publish new event to Event Bus

### Acceptance Criteria

1. Users create emotions many time
2. Users receive successfully response
3. Do not have duplicate emotion in same hour for 1 user (loose condition)

### Technical Notes

- Add this API into gamification module
- Add Swagger docs in controller, follow code src/identity/presentation/rest/user.controller.ts
- Follow Error handle from technical.md
- Follow code style from src/identity
- Use upsert to detect an emotion at same hour if possible

## EMO-002: Implement get streak API

Status: To Do
Priority: High
Dependencies: None

### Requirements

- Get streak of user
- Require USER role
- Streak is the number of consecutive days that the user has log emotion

### Acceptance Criteria

1. Users get streak successfully
2. Do not have duplicate emotion in same hour for 1 user (loose condition)

### Technical Notes

- Add this API into gamification module
- Follow code style from src/identity

## EMO-003: Update streak when user create emotion

Status: To Do
Priority: High
Dependencies: None

### Requirements

- Update streak when user create emotion
- Require USER role
- Streak is the number of consecutive days that the user has log emotion

### Acceptance Criteria

1. User can see streak updated after create emotion

### Technical Notes

- Use event bus to update streak
- Use upsert to prevent race condition
- Emit event through event bus when user create emotion
- Handle event in streak handler

## EMO-004: Update create emotion API: Allow user write note for emotion

Status: To Do
Priority: High
Dependencies: EMO-001

## Context

- Currently, user can create emotion without note
- Create emotion API is in src/gamification/presentation/emotion.controller.ts

### Requirements

- Allow user write note for emotion
- Require USER role
- Note is a text that user can write to describe the emotion. Max length is 256 characters
- Should not pass note to event bus

### Acceptance Criteria

1. User can write note for emotion
2. User can see note after create emotion
3. User can create emotion without note

### Technical Notes

- Add this API into gamification module
- Follow code style from src/identity

## EMO-005: Implement API to get emotion in last 7 days

Status: To Do
Priority: High
Dependencies: None

### Requirements

- Get emotion in last 7 days of logged in user (include today)
- Require USER role
- Should return emotion data in descending order of date
- Combine emotion data by date:
  - Emotion of day is most intensity emotion of day, if there are more than 1 emotion return the last one
  - If there is no emotion in day, return null
- Output should be an array of object with date and emotion

### Acceptance Criteria

1. User can get emotion in last 7 days
2. User can see emotion data in descending order of date
3. User can see array of null emotion if user has no emotion in last 7 days
4. User can see emotion data in UTC time
5. User can see correct emotion combine by date

### Technical Notes

- Add this API into gamification module
- Follow code style from src/identity
- API GET /emotions/last-7-days
- Get date in UTC time
- Expected output:

```json
[
  { "date": "2024-01-01", "emotion": "joy" },
  // ...
]
```

## EMO-006: Change logic create emotion

Status: To Do
Priority: High
Dependencies: None

## Context

- In create emotion API, if user create emotion at same hour, we will update intensity of emotion instead of create new emotion
- In get emotion history API, we will combine emotion by date and find the most intensity emotion of day

### Requirements

- In create emotion API, do not replace emotion if user create emotion at same hour. Add all emotions to database
- In get emotion history API, emotion of day is emotion that has the highest sum of intensity of day

### Acceptance Criteria

1. User can create emotion without replace if user create emotion at same hour
2. User can get emotion history correctly

### Technical Notes

- Edit these API
  - API POST /emotions
  - API GET /emotions/last-7-days
