// mock/subjects.js
export const mockSubjects = [
  {
    id: 'subject-001',
    name: '张三',
    relationship: 'self',
    gender: 'male',
    calendarType: 'solar',
    birthYear: 1990,
    birthMonth: 5,
    birthDay: 15,
    birthHour: 10,
    birthMinute: 30,
    location: { province: 'beijing', city: 'beijing' },
    reportCount: 2
  },
  {
    id: 'subject-002',
    name: '李四',
    relationship: 'friend',
    gender: 'female',
    calendarType: 'lunar',
    birthYear: 1995,
    birthMonth: 8,
    birthDay: 20,
    birthHour: 14,
    birthMinute: 0,
    location: { province: 'shanghai', city: 'shanghai' },
    reportCount: 0
  }
];
