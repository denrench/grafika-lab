/* ==========================================================================
   ГРАФИКА LAB — ACCOUNT, IMMUTABLE ROLE & TEACHER VERIFICATION (DEMO)
   (js/auth.js)
   Notes on Security:
   - This is a frontend-only DEMO auth & storage system (no backend server).
   - It is explicitly labeled as DEMO in the UI and never claims server-grade
     cryptographic security.
   - Enforces immutable role per email, prevents re-registration with another
     role, binds a simple integrity signature to detect manual LocalStorage
     role tampering, and removes any post-login role switcher.
   ========================================================================== */

window.GrafikaAuth = (function () {
  'use strict';

  const STORAGE_ACCOUNTS = 'grafika_accounts_v3';
  const STORAGE_SESSION = 'grafika_session_v3';
  const STORAGE_TEACHER_DATA = 'grafika_teacher_data_v3';

  // Simple deterministic integrity checksum (DEMO client-side tamper guard)
  function computeRoleSeal(email, role) {
    const str = `GLAB::${email.toLowerCase()}::${role}::IMMUTABLE_V3`;
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(16);
  }

  function hashPassDemo(pw) {
    let h = 0;
    for (let i = 0; i < pw.length; i++) {
      h = ((h << 5) - h) + pw.charCodeAt(i);
      h |= 0;
    }
    return 'demo_' + Math.abs(h).toString(36);
  }

  function createDefaultStudentProfile(firstName, lastName, email, institution, group, joinCode, lang) {
    return {
      id: 'usr_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      role: 'student',
      roleSeal: computeRoleSeal(email, 'student'),
      firstName,
      lastName,
      email: email.toLowerCase(),
      institution: institution || 'Технический университет',
      group: group || 'ИГ-204',
      joinCode: joinCode || '',
      language: lang || 'ru',
      createdAt: new Date().toISOString().slice(0, 10),
      avatarFrame: 'default',
      level: 1,
      points: 45, // Starter demo points from introductory onboarding
      completedLessons: ['intro-geom'],
      lessonScores: {
        'intro-geom': { score: 92, date: '2026-11-20', status: 'done', title: 'Основы геометрических тел' }
      },
      gradesHistory: [
        {
          id: 'gr_init_1',
          lessonId: 'intro-geom',
          lessonTitle: 'Основы геометрических тел',
          taskTitle: 'Распознавание призм и цилиндров',
          date: '2026-11-20',
          resultPct: 92,
          gradeLabel: 'Очень хорошо',
          pointsAwarded: 25,
          status: 'done',
          strengths: 'Отличное понимание базовых объёмных форм и осей симметрии.',
          errors: 'Небольшая неточность при указании высоты цилиндра.',
          recommendation: 'Переходите к уроку «Ортогональные проекции».'
        }
      ],
      pointsLedger: [
        { id: 'pt_init_1', date: '2026-11-20', action: 'Завершение вводного урока', delta: +10 },
        { id: 'pt_init_2', date: '2026-11-20', action: 'Практика: Распознавание форм (92%)', delta: +30 },
        { id: 'pt_init_3', date: '2026-11-20', action: 'Бонус первого запуска', delta: +5 }
      ],
      rewardedKeys: ['lesson:intro-geom', 'practice:intro-geom:92'],
      ownedStoreItems: [],
      hintsInventory: { firstStep: 1, dimensions: 1, projection: 0, placement: 0 },
      topicStats: {
        'Геометрические фигуры': 92,
        'Изометрия': 80,
        'Ортогональные проекции': 74,
        'Размеры ГОСТ': 78,
        'Чтение чертежей': 70
      },
      savedConstructions: []
    };
  }

  function createDefaultTeacherProfile(firstName, lastName, email, institution, position, subject, verifyMethod, verifyCode, lang) {
    let verificationStatus = 'Pending';
    const lowerEmail = email.toLowerCase();
    const codeUpper = (verifyCode || '').trim().toUpperCase();

    if (verifyMethod === 'admin' && (codeUpper === 'ADMIN-2026' || codeUpper === 'LAB-2026')) {
      verificationStatus = 'Verified';
    } else if (verifyMethod === 'inst' && (codeUpper === 'INST-77' || codeUpper === 'UNI-2026')) {
      verificationStatus = 'Verified';
    } else if (verifyMethod === 'email' && (lowerEmail.endsWith('.edu') || lowerEmail.endsWith('.ac.uk') || lowerEmail.includes('uni') || lowerEmail.includes('edu.'))) {
      verificationStatus = 'Verified';
    } else if (codeUpper === 'REJECT') {
      verificationStatus = 'Rejected';
    }

    return {
      id: 'tch_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      role: 'teacher',
      roleSeal: computeRoleSeal(email, 'teacher'),
      firstName,
      lastName,
      email: lowerEmail,
      institution: institution || 'Кафедра инженерной графики',
      position: position || 'Старший преподаватель',
      subject: subject || 'Инженерная и компьютерная графика',
      verifyMethod,
      verifyCode: verifyCode || '',
      verificationStatus, // 'Pending' | 'Verified' | 'Rejected'
      language: lang || 'ru',
      createdAt: new Date().toISOString().slice(0, 10)
    };
  }

  function loadAccounts() {
    try {
      const raw = localStorage.getItem(STORAGE_ACCOUNTS);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    // Seed 2 demo accounts so evaluators can log in immediately
    const demoStudent = createDefaultStudentProfile(
      'Данил', 'Панин', 'student@grafika.lab', 'Политехнический колледж', 'ИГ-204', 'IG-204', 'ru'
    );
    demoStudent.passwordHash = hashPassDemo('123456');

    const demoTeacher = createDefaultTeacherProfile(
      'Алексей', 'Соколов', 'teacher@uni.edu', 'Кафедра инженерной графики', 'Доцент', 'Инженерная графика и CAD', 'email', 'ADMIN-2026', 'ru'
    );
    demoTeacher.passwordHash = hashPassDemo('123456');
    demoTeacher.verificationStatus = 'Verified';

    const seeded = [demoStudent, demoTeacher];
    saveAccounts(seeded);
    return seeded;
  }

  function saveAccounts(list) {
    try {
      localStorage.setItem(STORAGE_ACCOUNTS, JSON.stringify(list));
    } catch (e) {}
  }

  function loadTeacherData() {
    try {
      const raw = localStorage.getItem(STORAGE_TEACHER_DATA);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    const initial = {
      groups: [
        {
          id: 'grp_1',
          name: 'Группа ИГ-204',
          course: '1 курс — Инженерная графика',
          code: 'IG-204',
          codeActive: true,
          students: [
            { name: 'Данил Панин', email: 'student@grafika.lab', avgScore: 92, completed: 4, total: 5, needsHelp: false },
            { name: 'Алина Серова', email: 'alina@edu.ru', avgScore: 86, completed: 4, total: 5, needsHelp: false },
            { name: 'Максим Орлов', email: 'max@edu.ru', avgScore: 61, completed: 2, total: 5, needsHelp: true },
            { name: 'Тимур Аскаров', email: 'timur@edu.ru', avgScore: 78, completed: 3, total: 5, needsHelp: false }
          ]
        },
        {
          id: 'grp_2',
          name: 'Группа АРХ-102',
          course: '1 курс — Архитектурное черчение',
          code: 'ARH-102',
          codeActive: true,
          students: [
            { name: 'Елена Волкова', email: 'elena@edu.ru', avgScore: 96, completed: 5, total: 5, needsHelp: false },
            { name: 'Илья Громов', email: 'ilya@edu.ru', avgScore: 54, completed: 1, total: 5, needsHelp: true }
          ]
        }
      ],
      assignments: [
        {
          id: 'asg_1',
          topic: 'Ортогональные проекции',
          lesson: 'Метод Монжа (V, H, W)',
          title: 'Построить 3 проекции ступенчатой опоры',
          difficulty: 'Intermediate',
          groupId: 'grp_1',
          groupName: 'Группа ИГ-204',
          deadline: '2026-11-30',
          instructions: 'Изучите деталь в Лаборатории проекций и определите невидимые контуры паза на профильной проекции W.'
        },
        {
          id: 'asg_2',
          topic: 'Изометрия',
          lesson: 'Построение изометрического овала',
          title: 'Собрать цилиндрическую втулку в конструкторе',
          difficulty: 'Beginner',
          groupId: 'grp_2',
          groupName: 'Группа АРХ-102',
          deadline: '2026-12-03',
          instructions: 'Создайте основание 60×40×20 и установите сверху цилиндр Ø30.'
        }
      ],
      submissions: [
        {
          id: 'sub_1',
          studentName: 'Максим Орлов',
          groupName: 'Группа ИГ-204',
          taskTitle: 'Построить 3 проекции ступенчатой опоры',
          submittedAt: '2026-11-22',
          status: 'pending_review',
          grade: null,
          comment: '',
          workSummary: 'Построены виды V и H, требуется проверка штриховой линии на виде W.'
        },
        {
          id: 'sub_2',
          studentName: 'Алина Серова',
          groupName: 'Группа ИГ-204',
          taskTitle: 'Построить 3 проекции ступенчатой опоры',
          submittedAt: '2026-11-21',
          status: 'graded',
          grade: 94,
          comment: 'Очень аккуратное построение и верные линии связи 45°.',
          workSummary: 'Все три проекции и размеры по ГОСТ 2.307 выполнены.'
        }
      ]
    };
    saveTeacherData(initial);
    return initial;
  }

  function saveTeacherData(data) {
    try {
      localStorage.setItem(STORAGE_TEACHER_DATA, JSON.stringify(data));
    } catch (e) {}
  }

  function getCurrentUser() {
    try {
      const sessRaw = localStorage.getItem(STORAGE_SESSION);
      if (!sessRaw) return null;
      const sess = JSON.parse(sessRaw);
      const accounts = loadAccounts();
      const user = accounts.find(a => a.id === sess.userId && a.email === sess.email);
      if (!user) return null;

      // Verify immutable role seal (DEMO client-side tamper detection)
      const expectedSeal = computeRoleSeal(user.email, user.role);
      if (user.roleSeal !== expectedSeal) {
        // Tampering detected in localStorage -> force logout
        localStorage.removeItem(STORAGE_SESSION);
        return null;
      }
      return user;
    } catch (e) {
      return null;
    }
  }

  function saveCurrentUser(updatedUser) {
    const accounts = loadAccounts();
    const idx = accounts.findIndex(a => a.id === updatedUser.id);
    if (idx !== -1) {
      // Never allow role mutation on existing user
      updatedUser.role = accounts[idx].role;
      updatedUser.roleSeal = accounts[idx].roleSeal;
      accounts[idx] = updatedUser;
      saveAccounts(accounts);
    }
  }

  function setSession(user) {
    localStorage.setItem(STORAGE_SESSION, JSON.stringify({
      userId: user.id,
      email: user.email,
      role: user.role
    }));
  }

  function logout() {
    localStorage.removeItem(STORAGE_SESSION);
  }

  function registerStudent(payload) {
    const t = window.GrafikaI18n.t;
    const email = (payload.email || '').trim().toLowerCase();
    if (!payload.firstName || !payload.lastName || !email || !payload.institution || !payload.group || !payload.password) {
      return { ok: false, error: t('err_required') };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { ok: false, error: t('err_email') };
    }
    if (payload.password.length < 6) {
      return { ok: false, error: t('err_pass_len') };
    }
    if (payload.password !== payload.password2) {
      return { ok: false, error: t('err_pass_match') };
    }
    const accounts = loadAccounts();
    if (accounts.some(a => a.email === email)) {
      return { ok: false, error: t('err_email_exists') };
    }

    const user = createDefaultStudentProfile(
      payload.firstName.trim(),
      payload.lastName.trim(),
      email,
      payload.institution.trim(),
      payload.group.trim(),
      (payload.joinCode || '').trim(),
      payload.language || 'ru'
    );
    user.passwordHash = hashPassDemo(payload.password);
    accounts.push(user);
    saveAccounts(accounts);
    setSession(user);

    // If joinCode matches a teacher group, add student to group roster
    if (user.joinCode) {
      const tData = loadTeacherData();
      const grp = tData.groups.find(g => g.codeActive && g.code.toUpperCase() === user.joinCode.toUpperCase());
      if (grp && !grp.students.some(s => s.email === user.email)) {
        grp.students.push({
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          avgScore: 92,
          completed: 1,
          total: 5,
          needsHelp: false
        });
        saveTeacherData(tData);
      }
    }

    return { ok: true, user };
  }

  function registerTeacher(payload) {
    const t = window.GrafikaI18n.t;
    const email = (payload.email || '').trim().toLowerCase();
    if (!payload.firstName || !payload.lastName || !email || !payload.institution || !payload.position || !payload.subject || !payload.password) {
      return { ok: false, error: t('err_required') };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { ok: false, error: t('err_email') };
    }
    if (payload.password.length < 6) {
      return { ok: false, error: t('err_pass_len') };
    }
    if (payload.password !== payload.password2) {
      return { ok: false, error: t('err_pass_match') };
    }
    const accounts = loadAccounts();
    if (accounts.some(a => a.email === email)) {
      return { ok: false, error: t('err_email_exists') };
    }

    const user = createDefaultTeacherProfile(
      payload.firstName.trim(),
      payload.lastName.trim(),
      email,
      payload.institution.trim(),
      payload.position.trim(),
      payload.subject.trim(),
      payload.verifyMethod || 'app',
      payload.verifyCode || '',
      payload.language || 'ru'
    );
    user.passwordHash = hashPassDemo(payload.password);
    accounts.push(user);
    saveAccounts(accounts);
    setSession(user);

    return { ok: true, user };
  }

  function login(email, password) {
    const t = window.GrafikaI18n.t;
    const normEmail = (email || '').trim().toLowerCase();
    const accounts = loadAccounts();
    const user = accounts.find(a => a.email === normEmail && a.passwordHash === hashPassDemo(password || ''));
    if (!user) {
      return { ok: false, error: t('err_login_fail') };
    }
    setSession(user);
    return { ok: true, user };
  }

  function demoQuickLogin(role) {
    const accounts = loadAccounts();
    const targetEmail = role === 'teacher' ? 'teacher@uni.edu' : 'student@grafika.lab';
    const user = accounts.find(a => a.email === targetEmail);
    if (user) {
      setSession(user);
      return user;
    }
    return null;
  }

  function updateCurrentUserLang(lang) {
    const user = getCurrentUser();
    if (user) {
      user.language = lang;
      saveCurrentUser(user);
    }
  }

  // Anti-abuse Graphica Points Awarding
  function awardPoints(uniqueKey, amount, actionLabel, allowImprovementDelta) {
    const user = getCurrentUser();
    if (!user || user.role !== 'student') return { awarded: 0 };
    if (!user.rewardedKeys) user.rewardedKeys = [];
    if (!user.pointsLedger) user.pointsLedger = [];

    if (!allowImprovementDelta && user.rewardedKeys.includes(uniqueKey)) {
      return { awarded: 0, duplicate: true };
    }

    if (!user.rewardedKeys.includes(uniqueKey)) {
      user.rewardedKeys.push(uniqueKey);
    }

    user.points = (user.points || 0) + amount;
    user.level = Math.floor(user.points / 60) + 1;
    user.pointsLedger.unshift({
      id: 'pt_' + Date.now(),
      date: new Date().toISOString().slice(0, 10),
      action: actionLabel,
      delta: amount
    });
    saveCurrentUser(user);
    return { awarded: amount, balance: user.points, level: user.level };
  }

  function spendPoints(itemId, cost, label) {
    const user = getCurrentUser();
    if (!user || user.role !== 'student') return { ok: false, error: 'Только для студентов' };
    if ((user.points || 0) < cost) return { ok: false, error: 'Недостаточно Graphica Points' };

    user.points -= cost;
    if (!user.ownedStoreItems) user.ownedStoreItems = [];
    if (!user.ownedStoreItems.includes(itemId)) {
      user.ownedStoreItems.push(itemId);
    }
    user.pointsLedger.unshift({
      id: 'sp_' + Date.now(),
      date: new Date().toISOString().slice(0, 10),
      action: `Магазин: ${label}`,
      delta: -cost
    });
    saveCurrentUser(user);
    return { ok: true, balance: user.points };
  }

  return {
    getCurrentUser,
    saveCurrentUser,
    registerStudent,
    registerTeacher,
    login,
    demoQuickLogin,
    logout,
    updateCurrentUserLang,
    awardPoints,
    spendPoints,
    loadTeacherData,
    saveTeacherData
  };
})();
