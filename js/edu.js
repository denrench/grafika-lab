/* ==========================================================================
   ГРАФИКА LAB — COMPLETE EDUCATIONAL ENGINE (js/edu.js)
   Modules:
   1. Geometry Figures Catalog (11 figures: Beginner / Intermediate / Advanced)
   2. Guided Build Mode (3-column interactive step-by-step 3D builder)
   3. Interactive Structured Lessons + Topic-Matched Practice + Grading + Points
   4. Points Store (Hints, Extra Examples, Avatar Frames, Study Packs)
   5. Student Account & Analytics (Grades Table, Strengths, Difficulties, Charts)
   6. Teacher Dashboard (DEMO Verification, Groups, Assignments, Grading, Analytics)
   ========================================================================== */

window.GrafikaEdu = (function () {
  'use strict';

  const Models = window.GrafikaModels;
  const Engine = window.GrafikaEngine3D;

  // ==========================================================================
  // 1. GEOMETRY FIGURES CATALOG (11 FIGURES)
  // ==========================================================================
  const FIGURES_CATALOG = [
    { id: 'cube', name: 'Куб', en: 'Cube', level: 'Beginner', time: '5 мин', prim: 'cube', dims: { w: 40, d: 40, h: 40 }, desc: 'Правильный шестигранник с равными гранями. Основа для понимания координат X, Y, Z.', lessonId: 'intro-geom', guidedId: 'gb-cube' },
    { id: 'box', name: 'Прямоугольный параллелепипед', en: 'Rectangular Prism', level: 'Beginner', time: '6 мин', prim: 'block', dims: { w: 60, d: 40, h: 30 }, desc: 'Базовый строительный блок с тремя независимыми размерами: ширина, глубина и высота.', lessonId: 'intro-geom', guidedId: 'gb-stepped' },
    { id: 'prism', name: 'Треугольная призма', en: 'Triangular Prism', level: 'Beginner', time: '7 мин', prim: 'prism', dims: { w: 40, d: 40, h: 40 }, desc: 'Многогранник с наклонными гранями. Учит видеть проекционное укорочение на видах.', lessonId: 'ortho-proj', guidedId: 'gb-stepped' },
    { id: 'pyramid', name: 'Четырёхугольная пирамида', en: 'Pyramid', level: 'Beginner', time: '7 мин', prim: 'pyramid', dims: { w: 45, d: 45, h: 50 }, desc: 'Тело с квадратным основанием и вершиной, проецируемой в центр диагоналей.', lessonId: 'ortho-proj', guidedId: 'gb-cube' },
    { id: 'cylinder', name: 'Цилиндр', en: 'Cylinder', level: 'Intermediate', time: '8 мин', prim: 'cylinder', dims: { w: 44, d: 44, h: 52 }, desc: 'Тело вращения: на виде сверху — окружность, на фронтальном виде — прямоугольник.', lessonId: 'iso-axes', guidedId: 'gb-bushing' },
    { id: 'cone', name: 'Конус', en: 'Cone', level: 'Intermediate', time: '8 мин', prim: 'cone', dims: { w: 44, d: 44, h: 54 }, desc: 'Тело вращения с круговым основанием и очерковыми образующими на фронтальной проекции.', lessonId: 'iso-axes', guidedId: 'gb-bushing' },
    { id: 'sphere', name: 'Сфера', en: 'Sphere', level: 'Intermediate', time: '6 мин', prim: 'sphere', dims: { w: 46, d: 46, h: 46 }, desc: 'Во всех трёх ортогональных проекциях (V, H, W) сфера изображается равными окружностями.', lessonId: 'iso-axes', guidedId: 'gb-bushing' },
    { id: 'tetrahedron', name: 'Тетраэдр', en: 'Tetrahedron', level: 'Intermediate', time: '9 мин', prim: 'tetrahedron', dims: { w: 46, d: 46, h: 46 }, desc: 'Четырёхгранник из равносторонних треугольников — классическая задача на рёбра.', lessonId: 'ortho-proj', guidedId: 'gb-cube' },
    { id: 'combined', name: 'Комбинированные объекты', en: 'Combined Solids', level: 'Advanced', time: '12 мин', modelIdx: 2, desc: 'Сочетание призматического основания и цилиндрических ступеней (фланцевая втулка).', lessonId: 'iso-axes', guidedId: 'gb-bushing' },
    { id: 'stepped', name: 'Ступенчатые детали', en: 'Stepped Parts', level: 'Advanced', time: '12 мин', modelIdx: 0, desc: 'Многоуровневая опора с уступами и пазами. Развивает чтение линий связи 45°.', lessonId: 'ortho-proj', guidedId: 'gb-stepped' },
    { id: 'holed', name: 'Детали с отверстиями', en: 'Parts with Holes', level: 'Advanced', time: '15 мин', modelIdx: 1, desc: 'Кронштейн со сквозным внутренним каналом и невидимыми штриховыми контурами по ГОСТ.', lessonId: 'dims-hidden', guidedId: 'gb-stepped' }
  ];

  // ==========================================================================
  // 2. GUIDED BUILD TUTORIALS (ПОСТРОЕНИЕ ПО ШАГАМ)
  // ==========================================================================
  const GUIDED_TUTORIALS = [
    {
      id: 'gb-stepped',
      title: 'Построение ступенчатого объекта',
      difficulty: 'Beginner',
      steps: [
        {
          title: 'Шаг 1: Создай основу объекта',
          instruction: 'Нажмите кнопку «Добавить основу (Блок)», чтобы разместить нижнюю базовую плиту на рабочей плоскости.',
          hint: 'Используйте подсвеченную кнопку «+ Прямоугольный блок» в правой панели параметров.',
          highlight: 'add-block',
          check: (st) => st.parts.length >= 1
        },
        {
          title: 'Шаг 2: Установи необходимые размеры',
          instruction: 'Задайте для базовой плиты размеры: Ширина = 80 мм, Глубина = 40 мм, Высота = 30 мм.',
          hint: 'Измените поля «Ширина», «Высота», «Глубина» справа и сразу увидите обновление в 3D.',
          highlight: 'dims',
          check: (st) => st.parts.length >= 1 && st.parts[0].w === 80 && st.parts[0].h === 30 && st.parts[0].d === 40
        },
        {
          title: 'Шаг 3: Добавь вторую ступень',
          instruction: 'Нажмите «+ Добавить куб (Верхняя ступень)», чтобы установить верхний блок на основание.',
          hint: 'Вторая деталь автоматически привяжется к верхней грани основы.',
          highlight: 'add-top',
          check: (st) => st.parts.length >= 2
        },
        {
          title: 'Шаг 4: Проверь форму со всех сторон',
          instruction: 'Поверните 3D-модель мышью или нажмите кнопку «Осмотреть 360°», чтобы убедиться в правильном перекрытии граней.',
          hint: 'Зажмите левую кнопку мыши на 3D-сцене и слегка поверните модель.',
          highlight: 'orbit',
          check: (st) => st.hasOrbited
        },
        {
          title: 'Шаг 5: Готово! Проверка и награда',
          instruction: 'Отличная работа! Ступенчатый объект построен верно. Нажмите «Завершить и получить баллы».',
          hint: 'Вы получите +15 Graphica Points за первое успешное прохождение.',
          highlight: 'finish',
          check: () => true
        }
      ]
    },
    {
      id: 'gb-cube',
      title: 'Точный куб по размерам 40×40×40',
      difficulty: 'Beginner',
      steps: [
        {
          title: 'Шаг 1: Размести куб на плоскости',
          instruction: 'Нажмите «+ Добавить куб» в панели инструментов справа.',
          hint: 'Куб появится в начале координат (0, 0, 0).',
          highlight: 'add-top',
          check: (st) => st.parts.length >= 1
        },
        {
          title: 'Шаг 2: Установи точные размеры 40×40×40',
          instruction: 'Убедитесь, что Ширина = 40, Высота = 40, Глубина = 40 мм.',
          hint: 'Нажмите кнопку «Сброс 40×40×40» или введите значения вручную.',
          highlight: 'dims',
          check: (st) => st.parts.length >= 1 && st.parts[0].w === 40 && st.parts[0].h === 40 && st.parts[0].d === 40
        },
        {
          title: 'Шаг 3: Осмотри модель в 3D',
          instruction: 'Поверните куб мышью или нажмите «Осмотреть 360°», чтобы проверить все 6 непрозрачных граней.',
          hint: 'Обратите внимание, как освещение выделяет рёбра куба.',
          highlight: 'orbit',
          check: (st) => st.hasOrbited
        },
        {
          title: 'Шаг 4: Готово!',
          instruction: 'Куб построен точно по ГОСТ. Нажмите «Завершить и получить баллы».',
          hint: 'Переходите к более сложным фигурам в каталоге!',
          highlight: 'finish',
          check: () => true
        }
      ]
    },
    {
      id: 'gb-bushing',
      title: 'Цилиндрическая втулка на плите',
      difficulty: 'Intermediate',
      steps: [
        {
          title: 'Шаг 1: Создай опорный фланец',
          instruction: 'Добавьте прямоугольный блок в качестве основания фланца.',
          hint: 'Нажмите «+ Прямоугольный блок».',
          highlight: 'add-block',
          check: (st) => st.parts.length >= 1
        },
        {
          title: 'Шаг 2: Задай толщину фланца',
          instruction: 'Установите размеры фланца: Ширина = 60, Глубина = 60, Высота = 20 мм.',
          hint: 'Измените числовые поля справа.',
          highlight: 'dims',
          check: (st) => st.parts.length >= 1 && st.parts[0].w === 60 && st.parts[0].d === 60 && st.parts[0].h === 20
        },
        {
          title: 'Шаг 3: Установи цилиндрическую башню',
          instruction: 'Нажмите «+ Добавить цилиндр», чтобы разместить тело вращения по центру фланца.',
          hint: 'Цилиндр автоматически выровняется по оси Z.',
          highlight: 'add-cyl',
          check: (st) => st.parts.some(p => p.type === 'cylinder')
        },
        {
          title: 'Шаг 4: Проверь соосность в 3D',
          instruction: 'Поверните модель, чтобы проверить симметрию цилиндра на основании.',
          hint: 'Используйте мышь или кнопку «Осмотреть 360°».',
          highlight: 'orbit',
          check: (st) => st.hasOrbited
        },
        {
          title: 'Шаг 5: Готово!',
          instruction: 'Комбинированная деталь «Втулка с фланцем» собрана. Заберите награду!',
          hint: 'Вы можете сохранить её или открыть в Лаборатории проекций.',
          highlight: 'finish',
          check: () => true
        }
      ]
    }
  ];

  // ==========================================================================
  // 3. INTERACTIVE LESSONS + TOPIC-MATCHED PRACTICE QUIZZES
  // ==========================================================================
  const EDU_LESSONS = [
    {
      id: 'intro-geom',
      num: '01',
      topic: 'Геометрические фигуры',
      difficulty: 'Beginner',
      title: 'Основы геометрических тел',
      why: 'Любая сложная инженерная деталь — это комбинация простых геометрических тел: кубов, призм, цилиндров и пирамид. Умение раскладывать форму на примитивы делает черчение простым.',
      what: [
        'Различать многогранники (куб, призма, пирамида) и тела вращения (цилиндр, конус, сфера).',
        'Понимать три основных измерения детали: ширина (X), глубина (Y) и высота (Z).',
        'Читать габаритные размеры объёмного тела.'
      ],
      blocks: [
        { h: 'Многогранники', p: 'Ограничены плоскими гранями. Их проекции состоят из прямых отрезков, которые чётко определяют форму.' },
        { h: 'Тела вращения', p: 'Образованы вращением контура вокруг оси (цилиндр, конус, сфера). Всегда имеют ось симметрии (штрихпунктирная линия).' }
      ],
      modelIdx: 2,
      guidedId: 'gb-cube',
      practice: {
        title: 'Распознавание и параметры геометрических тел',
        difficulty: 'Beginner',
        hintText: 'Подсказка: У сферы все три ортогональные проекции (спереди, сверху и слева) являются одинаковыми окружностями.',
        questions: [
          {
            q: 'Какое геометрическое тело на ВСЕХ трёх ортогональных проекциях (V, H, W) выглядит как окружность?',
            options: ['Цилиндр', 'Сфера', 'Конус', 'Шестиугольная призма'],
            correct: 1,
            explain: 'Сфера симметрична во всех направлениях, поэтому её проекции на V, H и W — равные окружности.'
          },
          {
            q: 'Как выглядит вертикальный цилиндр на ВИДЕ СПЕРЕДИ (фронтальная проекция V)?',
            options: ['Как треугольник', 'Как окружность', 'Как прямоугольник с осевой линией', 'Как ромб'],
            correct: 2,
            explain: 'При взгляде сбоку на вертикальный цилиндр его контур образует прямоугольник, разделённый вертикальной осью симметрии.'
          },
          {
            q: 'Какая ось в инженерной графике обычно отвечает за ВЫСОТУ детали?',
            options: ['Ось X', 'Ось Y', 'Ось Z', 'Биссектриса 45°'],
            correct: 2,
            explain: 'В стандартной инженерной системе координат X — длина/ширина, Y — глубина, Z — высота.'
          }
        ]
      }
    },
    {
      id: 'ortho-proj',
      num: '02',
      topic: 'Ортогональные проекции',
      difficulty: 'Intermediate',
      title: 'Ортогональные проекции (Метод Монжа)',
      why: 'Проекции позволяют показать объёмную деталь на плоском чертеже так, чтобы другой инженер или станок могли безошибочно понять её точную форму и размеры.',
      what: [
        'Понимать расположение трёх основных видов: спереди (V), сверху (H) и слева (W).',
        'Использовать линии проекционной связи и постоянную прямую 45°.',
        'Отличать видимый контур (сплошная линия) от невидимого (штриховая линия).'
      ],
      blocks: [
        { h: 'Три плоскости проекций', p: 'Вид спереди (V) — главный вид. Вид сверху (H) строго под главным. Вид слева (W) располагается справа от главного.' },
        { h: 'Правило связи 45°', p: 'Глубина детали (ось Y) переносится с вида сверху на вид слева через прямую под углом 45°.' }
      ],
      modelIdx: 0,
      guidedId: 'gb-stepped',
      practice: {
        title: 'Проверка понимания ортогональных проекций',
        difficulty: 'Intermediate',
        hintText: 'Подсказка: По ГОСТ 2.305-2008 вид сверху всегда располагается строго ПОД главным видом, а вид слева — СПРАВА от главного.',
        questions: [
          {
            q: 'Где на чертеже по ГОСТ 2.305-2008 располагается ВИД СЛЕВА (профильная проекция W)?',
            options: ['Слева от главного вида', 'Справа от главного вида', 'Над главным видом', 'Под видом сверху'],
            correct: 1,
            explain: 'По европейскому методу проецирования (ГОСТ 2.305) вид слева всегда проецируется и чертится СПРАВА от главного вида.'
          },
          {
            q: 'Какой линией на ортогональном чертеже показывают скрытый (невидимый) паз или отверстие внутри детали?',
            options: ['Сплошной толстой', 'Штриховой линией', 'Волнистой линией', 'Скрытые элементы не чертят'],
            correct: 1,
            explain: 'Невидимые контуры по ГОСТ 2.303-68 изображаются штриховой линией.'
          },
          {
            q: 'Какие два измерения детали видны на ФРОНТАЛЬНОЙ проекции (вид спереди V)?',
            options: ['Длина (X) и Высота (Z)', 'Длина (X) и Глубина (Y)', 'Глубина (Y) и Высота (Z)', 'Только радиус'],
            correct: 0,
            explain: 'Главный вид (V) показывает ширину/длину вдоль оси X и высоту вдоль оси Z.'
          }
        ]
      }
    },
    {
      id: 'iso-axes',
      num: '03',
      topic: 'Изометрия',
      difficulty: 'Intermediate',
      title: 'Изометрия и аксонометрические оси',
      why: 'Изометрический чертёж даёт мгновенное наглядное представление об объёмной форме детали, помогая визуализировать конструкцию до её изготовления.',
      what: [
        'Строить изометрические оси X, Y, Z под углом 120° друг к другу.',
        'Откладывать натуральные размеры вдоль изометрических осей.',
        'Изображать окружности в изометрии в виде правильных овалов (эллипсов).'
      ],
      blocks: [
        { h: 'Углы изометрии', p: 'Ось Z направлена строго вверх, а оси X и Y наклонены под углом 30° к горизонтали (между всеми осями ровно 120°).' },
        { h: 'Окружность → Овал', p: 'В прямоугольной изометрии любая окружность на гранях детали превращается в эллипс (овал), вписанный в изометрический ромб.' }
      ],
      modelIdx: 3,
      guidedId: 'gb-bushing',
      practice: {
        title: 'Проверка навыков изометрии',
        difficulty: 'Intermediate',
        hintText: 'Подсказка: Между осями X, Y и Z в прямоугольной изометрии одинаковые углы по 120°.',
        questions: [
          {
            q: 'Какой угол образуют оси X, Y и Z между собой в прямоугольной изометрии?',
            options: ['90°', '120°', '45°', '60°'],
            correct: 1,
            explain: 'Полный круг 360° делится тремя осями поровну: 360° / 3 = 120°.'
          },
          {
            q: 'Под каким углом к горизонтальной линии наклонены оси X и Y в изометрии?',
            options: ['15°', '30°', '45°', '60°'],
            correct: 1,
            explain: 'Оси X и Y отклоняются вниз от горизонтали ровно на 30°.'
          },
          {
            q: 'Во что проецируется окружность, лежащая на верхней горизонтальной грани куба в изометрии?',
            options: ['В квадрат', 'В идеальный круг', 'В овал (эллипс)', 'В прямую линию'],
            correct: 2,
            explain: 'Из-за наклона плоскости окружность в изометрии отображается как овал (эллипс).'
          }
        ]
      }
    },
    {
      id: 'dims-hidden',
      num: '04',
      topic: 'Размеры ГОСТ',
      difficulty: 'Advanced',
      title: 'Нанесение размеров и разрезы (ЕСКД)',
      why: 'Без правильных размеров чертёж нельзя передать в производство. Разрезы же позволяют наглядно раскрыть внутренние полости без нагромождения штриховых линий.',
      what: [
        'Правильно указывать габаритные размеры в миллиметрах (без указания единиц).',
        'Применять знаки диаметра Ø и радиуса R.',
        'Понимать штриховку металла под углом 45° в разрезах (ГОСТ 2.306-68).'
      ],
      blocks: [
        { h: 'Единицы измерения', p: 'На машиностроительных чертежах все линейные размеры указываются в миллиметрах (мм), при этом само обозначение «мм» не пишется.' },
        { h: 'Штриховка разреза', p: 'Попавший в секущую плоскость материал (металл) штрихуется тонкими параллельными линиями под углом 45°.' }
      ],
      modelIdx: 1,
      guidedId: 'gb-stepped',
      practice: {
        title: 'Проверка правил нанесения размеров и разрезов',
        difficulty: 'Advanced',
        hintText: 'Подсказка: Линейные размеры на чертежах ГОСТ всегда в миллиметрах, а штриховка металлов выполняется под углом 45°.',
        questions: [
          {
            q: 'В каких единицах указываются линейные размеры на машиностроительных чертежах по ГОСТ 2.307?',
            options: ['В сантиметрах', 'В миллиметрах (без написания «мм»)', 'В метрах', 'В дюймах'],
            correct: 1,
            explain: 'По стандарту ЕСКД линейные размеры всегда проставляются в миллиметрах без указания единицы измерения.'
          },
          {
            q: 'Под каким углом выполняется стандартная штриховка металлических деталей в разрезе?',
            options: ['30°', '45°', '90°', '15°'],
            correct: 1,
            explain: 'По ГОСТ 2.306-68 металлы в разрезах и сечениях штрихуются тонкими сплошными линиями под углом 45°.'
          },
          {
            q: 'Какой знак ставится перед размерным числом диаметра цилиндрического отверстия?',
            options: ['R', 'Ø', '□', 'S'],
            correct: 1,
            explain: 'Знак Ø обозначает диаметр полной окружности, а знак R — радиус дуги.'
          }
        ]
      }
    }
  ];

  // ==========================================================================
  // 4. POINTS STORE CATALOG (FAIR, EDUCATIONAL & DECORATIVE REWARDS ONLY)
  // ==========================================================================
  const STORE_ITEMS = [
    { id: 'hint_first', cat: 'Подсказки', name: 'Подсказка по первому шагу', cost: 15, desc: 'Открывает подробный разбор первого шага в сложном практическом задании.', icon: '💡', type: 'hint', hintKey: 'firstStep' },
    { id: 'hint_dims', cat: 'Подсказки', name: 'Подсказка по размерам ГОСТ', cost: 20, desc: 'Показывает контрольные габариты и правила простановки размеров.', icon: '📏', type: 'hint', hintKey: 'dimensions' },
    { id: 'hint_proj', cat: 'Подсказки', name: 'Подсказка по проекции V/H/W', cost: 25, desc: 'Подсвечивает правильное направление проецирования и линии связи.', icon: '📐', type: 'hint', hintKey: 'projection' },
    { id: 'extra_ex_1', cat: 'Доп. примеры', name: 'Разбор сложного фланца', cost: 35, desc: 'Открывает дополнительный пошаговый пример построения фланцевой втулки с разрезом.', icon: '📘', type: 'example' },
    { id: 'extra_pack_1', cat: 'Доп. материалы', name: 'Сборник тренировочных чертежей', cost: 45, desc: 'Дополнительная подборка задач на пространственное мышление (необязательная практика).', icon: '📂', type: 'material' },
    { id: 'frame_gold', cat: 'Оформление', name: 'Рамка аватара «Архитектор»', cost: 30, desc: 'Изящная двойная золотисто-песочная рамка для вашего аватара в профиле.', icon: '✦', type: 'frame', frameClass: 'frame-architect' },
    { id: 'frame_sage', cat: 'Оформление', name: 'Рамка аватара «Мастер ЕСКД»', cost: 40, desc: 'Премиальный бейдж и шалфейно-чертёжная рамка для профиля студента.', icon: '◈', type: 'frame', frameClass: 'frame-master' },
    { id: 'badge_draft', cat: 'Награды', name: 'Значок «Циркуль и Рейсшина»', cost: 25, desc: 'Декоративный инженерный значок, отображаемый в личном профиле.', icon: '⌖', type: 'badge' }
  ];

  // ==========================================================================
  // STATE FOR GUIDED BUILD & LESSONS
  // ==========================================================================
  const gbState = {
    tutorialIdx: 0,
    stepIdx: 0,
    parts: [], // { type, gx, gy, gz, w, d, h }
    hasOrbited: false,
    yaw: -0.72,
    pitch: 0.52,
    scale: 1.75,
    isDragging: false,
    lastX: 0,
    lastY: 0
  };

  let activeLessonIdx = 0;
  let activeFigureFilter = 'All';

  // ==========================================================================
  // RENDERERS: 1. GEOMETRY FIGURES CATALOG
  // ==========================================================================
  function renderFiguresCatalog() {
    const grid = document.getElementById('figures-catalog-grid');
    if (!grid) return;

    const list = activeFigureFilter === 'All'
      ? FIGURES_CATALOG
      : FIGURES_CATALOG.filter(f => f.level === activeFigureFilter);

    grid.innerHTML = list.map(f => `
      <div class="figure-card">
        <div class="fig-card-top">
          <span class="fig-level-badge lvl-${f.level.toLowerCase()}">${f.level}</span>
          <span class="fig-time">⏱ ${f.time}</span>
        </div>
        <div class="fig-preview-box">
          <canvas class="fig-mini-canvas" data-fig-id="${f.id}" width="200" height="130"></canvas>
        </div>
        <h3 class="fig-name">${f.name}</h3>
        <p class="fig-desc">${f.desc}</p>
        <div class="fig-actions">
          <button class="btn-secondary small" data-fig-study="${f.lessonId}">Изучить</button>
          <button class="btn-primary small" data-fig-build="${f.guidedId}">Попробовать построить</button>
        </div>
      </div>
    `).join('');

    // Render crisp opaque 3D previews on each figure card
    grid.querySelectorAll('.fig-mini-canvas').forEach(cv => {
      const fig = FIGURES_CATALOG.find(x => x.id === cv.dataset.figId);
      if (!fig) return;
      let mesh;
      if (typeof fig.modelIdx === 'number') {
        mesh = Models.PROJECTION_MODELS[fig.modelIdx].build();
      } else {
        mesh = Models.createBuilderPrimitive(fig.prim, 0, 0, -0.5, 0, 1, false, fig.dims);
      }
      Engine.renderMesh3D(cv.getContext('2d'), mesh, {
        yaw: -0.68,
        pitch: 0.48,
        scale: typeof fig.modelIdx === 'number' ? 0.85 : 1.55,
        mode: 'solid',
        showGrid: false,
        showAxes: false
      });
    });

    grid.querySelectorAll('[data-fig-study]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = EDU_LESSONS.findIndex(l => l.id === btn.dataset.figStudy);
        if (idx !== -1) activeLessonIdx = idx;
        if (window.GrafikaSwitchView) window.GrafikaSwitchView('lessons');
        renderLessonsView();
      });
    });

    grid.querySelectorAll('[data-fig-build]').forEach(btn => {
      btn.addEventListener('click', () => {
        const tIdx = GUIDED_TUTORIALS.findIndex(g => g.id === btn.dataset.figBuild);
        startGuidedTutorial(tIdx !== -1 ? tIdx : 0);
        if (window.GrafikaSwitchView) window.GrafikaSwitchView('guided');
      });
    });
  }

  // ==========================================================================
  // RENDERERS: 2. GUIDED BUILD (ПОСТРОЕНИЕ ПО ШАГАМ)
  // ==========================================================================
  function startGuidedTutorial(idx) {
    gbState.tutorialIdx = idx;
    gbState.stepIdx = 0;
    gbState.parts = [];
    gbState.hasOrbited = false;
    gbState.yaw = -0.72;
    gbState.pitch = 0.52;
    renderGuidedBuildUI();
    renderGuidedCanvas();
  }

  function renderGuidedCanvas() {
    const cv = document.getElementById('guided-3d-canvas');
    if (!cv) return;
    const ctx = cv.getContext('2d');

    const subMeshes = gbState.parts.map((p, i) =>
      Models.createBuilderPrimitive(p.type, p.gx, p.gy, p.gz, 0, i + 1, i === gbState.parts.length - 1, { w: p.w, d: p.d, h: p.h })
    );
    const merged = Models.mergeMeshes(subMeshes);

    Engine.renderMesh3D(ctx, merged, {
      cy: cv.height / 2 + 40,
      yaw: gbState.yaw,
      pitch: gbState.pitch,
      scale: gbState.scale,
      mode: 'solid',
      showGrid: true,
      showAxes: true,
      showDimensions: gbState.parts.length > 0,
      gridZ: 0
    });
  }

  function renderGuidedBuildUI() {
    const tut = GUIDED_TUTORIALS[gbState.tutorialIdx];
    const step = tut.steps[gbState.stepIdx];
    const isStepDone = step.check(gbState);

    const titleEl = document.getElementById('gb-tut-title');
    const stepTitleEl = document.getElementById('gb-step-title');
    const stepInstrEl = document.getElementById('gb-step-instr');
    const stepHintEl = document.getElementById('gb-step-hint-box');
    const progressEl = document.getElementById('gb-progress-bar');
    const stepsListEl = document.getElementById('gb-steps-list');
    const nextBtn = document.getElementById('gb-next-btn');

    if (titleEl) titleEl.textContent = tut.title;
    if (stepTitleEl) stepTitleEl.textContent = step.title;
    if (stepInstrEl) stepInstrEl.textContent = step.instruction;
    if (stepHintEl) {
      stepHintEl.textContent = step.hint;
      stepHintEl.style.display = 'none';
    }
    if (progressEl) {
      const pct = Math.round(((gbState.stepIdx + 1) / tut.steps.length) * 100);
      progressEl.style.width = `${pct}%`;
    }

    if (stepsListEl) {
      stepsListEl.innerHTML = tut.steps.map((s, idx) => `
        <div class="gb-step-pill ${idx < gbState.stepIdx ? 'done' : idx === gbState.stepIdx ? 'active' : ''}">
          <span>${idx < gbState.stepIdx ? '✓' : idx + 1}</span>
          <span>${s.title}</span>
        </div>
      `).join('');
    }

    // Highlight active tool
    document.querySelectorAll('[data-gb-tool]').forEach(el => {
      el.classList.toggle('gb-pulse-highlight', el.dataset.gbTool === step.highlight);
    });

    if (nextBtn) {
      const isLast = gbState.stepIdx === tut.steps.length - 1;
      nextBtn.textContent = isLast ? 'Завершить и получить +15 баллов ✓' : 'Следующий шаг →';
      nextBtn.disabled = !isStepDone;
    }

    // Sync numeric W/H/D fields with base part
    const wIn = document.getElementById('gb-input-w');
    const hIn = document.getElementById('gb-input-h');
    const dIn = document.getElementById('gb-input-d');
    if (gbState.parts.length > 0 && wIn && hIn && dIn) {
      wIn.value = gbState.parts[0].w;
      hIn.value = gbState.parts[0].h;
      dIn.value = gbState.parts[0].d;
    }

    renderGuidedCanvas();
  }

  // ==========================================================================
  // RENDERERS: 3. INTERACTIVE LESSONS + PRACTICE + GRADING
  // ==========================================================================
  function renderLessonsView() {
    const nav = document.getElementById('edu-lessons-nav');
    const content = document.getElementById('edu-lesson-body');
    if (!nav || !content) return;

    const user = window.GrafikaAuth.getCurrentUser();
    const completed = (user && user.completedLessons) || [];

    nav.innerHTML = EDU_LESSONS.map((l, idx) => `
      <button class="lesson-nav-item ${idx === activeLessonIdx ? 'active' : ''}" data-edu-les="${idx}">
        <span class="ln-num">УРОК ${l.num} • ${l.difficulty} ${completed.includes(l.id) ? '✓' : ''}</span>
        <span class="ln-title">${l.title}</span>
      </button>
    `).join('');

    nav.querySelectorAll('[data-edu-les]').forEach(btn => {
      btn.addEventListener('click', () => {
        activeLessonIdx = parseInt(btn.dataset.eduLes, 10);
        renderLessonsView();
      });
    });

    const les = EDU_LESSONS[activeLessonIdx];
    const hasHint = user && user.hintsInventory && (user.hintsInventory.firstStep > 0 || user.hintsInventory.projection > 0);

    content.innerHTML = `
      <div class="edu-lesson-card">
        <div class="edu-les-header">
          <div>
            <span class="tech-badge cyan">УРОК ${les.num} // ${les.topic} • ${les.difficulty}</span>
            <h2 class="edu-les-title">${les.title}</h2>
          </div>
          <button class="btn-secondary small" id="edu-open-guided-btn">Повторить в Guided Build →</button>
        </div>

        <div class="edu-two-col">
          <div class="edu-info-col">
            <div class="edu-box">
              <h4>1. Зачем это нужно?</h4>
              <p>${les.why}</p>
            </div>
            <div class="edu-box">
              <h4>2. Что мы изучим?</h4>
              <ul class="edu-list">
                ${les.what.map(w => `<li><span>✓</span> ${w}</li>`).join('')}
              </ul>
            </div>
            <div class="edu-blocks-row">
              ${les.blocks.map(b => `
                <div class="edu-mini-block">
                  <h5>${b.h}</h5>
                  <p>${b.p}</p>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="edu-visual-col">
            <div class="panel-title">ВИЗУАЛЬНЫЙ 3D-ПРИМЕР И ОРТОГОНАЛЬНЫЕ ВИДЫ</div>
            <div class="edu-canvas-pair">
              <canvas id="edu-lesson-3d" width="320" height="230"></canvas>
              <canvas id="edu-lesson-epure" width="320" height="230"></canvas>
            </div>
            <div class="edu-demo-actions">
              <button class="btn-ghost small" id="edu-mark-lesson-done">Отметить урок изученным (+10 баллов)</button>
              <button class="btn-primary small" id="edu-jump-practice">Перейти к практике: Проверь себя ↓</button>
            </div>
          </div>
        </div>
      </div>

      <!-- POST-LESSON PRACTICE BLOCK -->
      <div class="edu-practice-card" id="edu-practice-section">
        <div class="edu-prac-header">
          <div>
            <span class="tech-badge orange">ПРАКТИКА — ПРОВЕРЬ СЕБЯ // ТЕМА: ${les.topic}</span>
            <h3>${les.practice.title}</h3>
          </div>
          <button class="btn-ghost small" id="edu-use-hint-btn">
            💡 Использовать подсказку ${hasHint ? '(есть в наличии)' : '(купить в Магазине)'}
          </button>
        </div>

        <div class="edu-hint-banner" id="edu-hint-banner" style="display:none;">
          ${les.practice.hintText}
        </div>

        <form id="edu-practice-form" class="edu-quiz-list">
          ${les.practice.questions.map((q, qi) => `
            <div class="edu-quiz-item">
              <div class="edu-q-title">${qi + 1}. ${q.q}</div>
              <div class="edu-q-opts">
                ${q.options.map((opt, oi) => `
                  <label class="edu-radio-opt">
                    <input type="radio" name="q_${qi}" value="${oi}" required />
                    <span>${opt}</span>
                  </label>
                `).join('')}
              </div>
            </div>
          `).join('')}
          <div class="edu-prac-footer">
            <button type="submit" class="btn-primary">Проверить ответ и получить оценку ✓</button>
          </div>
        </form>

        <div id="edu-grade-result" class="edu-grade-result" style="display:none;"></div>
      </div>
    `;

    // Render live 3D & Monge Epure example for this lesson
    const mesh = Models.PROJECTION_MODELS[les.modelIdx].build();
    const cv3d = document.getElementById('edu-lesson-3d');
    const cvEp = document.getElementById('edu-lesson-epure');
    if (cv3d) {
      Engine.renderMesh3D(cv3d.getContext('2d'), mesh, {
        yaw: -0.68, pitch: 0.48, scale: 1.25, mode: 'solid', showAxes: true, showGrid: true
      });
    }
    if (cvEp) {
      Engine.renderMongeEpure(cvEp.getContext('2d'), mesh, { scale: 0.56, showHelpers: true, showHidden: true });
    }

    document.getElementById('edu-open-guided-btn').addEventListener('click', () => {
      const gIdx = GUIDED_TUTORIALS.findIndex(g => g.id === les.guidedId);
      startGuidedTutorial(gIdx !== -1 ? gIdx : 0);
      if (window.GrafikaSwitchView) window.GrafikaSwitchView('guided');
    });

    document.getElementById('edu-mark-lesson-done').addEventListener('click', () => {
      const u = window.GrafikaAuth.getCurrentUser();
      if (u && u.role === 'student') {
        if (!u.completedLessons.includes(les.id)) {
          u.completedLessons.push(les.id);
          window.GrafikaAuth.saveCurrentUser(u);
        }
        const res = window.GrafikaAuth.awardPoints(`lesson:${les.id}`, 10, `Завершение урока: ${les.title}`);
        if (window.GrafikaShowToast) {
          window.GrafikaShowToast(res.duplicate ? 'Урок уже был отмечен ранее (повторные баллы не начисляются)' : '+10 Graphica Points за завершение урока!');
        }
        syncAllAccountUI();
        renderLessonsView();
      }
    });

    document.getElementById('edu-jump-practice').addEventListener('click', () => {
      document.getElementById('edu-practice-section').scrollIntoView({ behavior: 'smooth' });
    });

    document.getElementById('edu-use-hint-btn').addEventListener('click', () => {
      const u = window.GrafikaAuth.getCurrentUser();
      const banner = document.getElementById('edu-hint-banner');
      if (u && u.hintsInventory && (u.hintsInventory.firstStep > 0 || u.hintsInventory.projection > 0 || u.hintsInventory.dimensions > 0)) {
        if (banner) banner.style.display = 'block';
        if (window.GrafikaShowToast) window.GrafikaShowToast('Подсказка активирована!');
      } else {
        if (window.GrafikaShowToast) window.GrafikaShowToast('У вас нет подсказок — обменяйте Graphica Points в Магазине!');
        if (window.GrafikaSwitchView) window.GrafikaSwitchView('store');
      }
    });

    document.getElementById('edu-practice-form').addEventListener('submit', (e) => {
      e.preventDefault();
      let correctCount = 0;
      const errorsList = [];
      const strengthsList = [];

      les.practice.questions.forEach((q, qi) => {
        const picked = document.querySelector(`input[name="q_${qi}"]:checked`);
        const val = picked ? parseInt(picked.value, 10) : -1;
        if (val === q.correct) {
          correctCount++;
          strengthsList.push(q.explain);
        } else {
          errorsList.push(`Вопрос ${qi + 1}: ${q.explain}`);
        }
      });

      const pct = Math.round((correctCount / les.practice.questions.length) * 100);
      let gradeLabel = 'Рекомендуется повторить урок и попробовать снова';
      let bonus = 0;
      if (pct === 100) { gradeLabel = 'Отлично (100%)'; bonus = 20; }
      else if (pct >= 90) { gradeLabel = 'Очень хорошо'; bonus = 15; }
      else if (pct >= 75) { gradeLabel = 'Хорошо'; bonus = 10; }
      else if (pct >= 60) { gradeLabel = 'Нужно повторить некоторые моменты'; bonus = 5; }

      const hardBonus = (les.practice.difficulty === 'Advanced' && pct >= 75) ? 25 : 0;
      const totalPotential = (pct >= 60 ? 15 : 0) + bonus + hardBonus;

      // Award points cleanly (unique first-time or improvement delta only)
      let u = window.GrafikaAuth.getCurrentUser();
      let awarded = 0;
      if (u && u.role === 'student') {
        const prevBest = (u.lessonScores && u.lessonScores[les.id]) ? u.lessonScores[les.id].score : 0;
        if (!u.completedLessons.includes(les.id) && pct >= 60) {
          u.completedLessons.push(les.id);
        }
        if (pct > prevBest) {
          u.lessonScores[les.id] = { score: pct, date: new Date().toISOString().slice(0, 10), status: pct >= 60 ? 'done' : 'repeat', title: les.title };
          u.topicStats[les.topic] = pct;
          window.GrafikaAuth.saveCurrentUser(u);
          const ptsRes = window.GrafikaAuth.awardPoints(`practice:${les.id}:${pct}`, totalPotential, `Практика «${les.title}» (${pct}%)`, true);
          awarded = ptsRes.awarded;
          // Reload fresh user after awardPoints so points & ledger are never overwritten
          u = window.GrafikaAuth.getCurrentUser();
        }
        // Record in gradesHistory
        u.gradesHistory.unshift({
          id: 'gr_' + Date.now(),
          lessonId: les.id,
          lessonTitle: les.title,
          taskTitle: les.practice.title,
          date: new Date().toISOString().slice(0, 10),
          resultPct: pct,
          gradeLabel,
          pointsAwarded: awarded,
          status: pct >= 60 ? 'done' : 'repeat',
          strengths: strengthsList.length ? strengthsList[0] : 'Хорошая попытка, продолжайте практиковаться!',
          errors: errorsList.length ? errorsList.join(' ') : 'Ошибок нет — безупречный результат!',
          recommendation: pct >= 90 ? 'Вы уверенно владеете темой. Переходите к следующему уроку!' : `Рекомендуем повторить блок «${les.title}» и пройти практику снова.`
        });
        window.GrafikaAuth.saveCurrentUser(u);
        syncAllAccountUI();
      }

      const resBox = document.getElementById('edu-grade-result');
      resBox.style.display = 'block';
      resBox.innerHTML = `
        <div class="grade-summary-top">
          <div class="grade-score-circle ${pct >= 75 ? 'good' : pct >= 60 ? 'mid' : 'low'}">${pct}%</div>
          <div>
            <h4>Оценка: ${gradeLabel}</h4>
            <p class="mono-muted">Начислено баллов: <strong>+${awarded} Graphica Points</strong> ${awarded === 0 ? '(результат не превысил предыдущий рекорд)' : ''}</p>
          </div>
        </div>
        <div class="grade-details-grid">
          <div class="gd-box"><strong>Что получилось хорошо:</strong><p>${strengthsList.length ? strengthsList.join(' ') : 'Вы начали освоение темы.'}</p></div>
          <div class="gd-box"><strong>Разбор ошибок и рекомендации:</strong><p>${errorsList.length ? errorsList.join(' ') : 'Ошибок нет! Отличное понимание инженерной графики.'}</p></div>
        </div>
      `;
    });
  }

  // ==========================================================================
  // RENDERERS: 4. POINTS STORE (МАГАЗИН НАГРАД)
  // ==========================================================================
  function renderPointsStore() {
    const grid = document.getElementById('points-store-grid');
    const balEl = document.getElementById('store-balance-val');
    if (!grid) return;

    const user = window.GrafikaAuth.getCurrentUser();
    const balance = user ? (user.points || 0) : 0;
    const owned = (user && user.ownedStoreItems) || [];
    if (balEl) balEl.textContent = `${balance} PTS`;

    grid.innerHTML = STORE_ITEMS.map(it => {
      const isOwned = owned.includes(it.id) && it.type !== 'hint';
      return `
        <div class="store-card ${isOwned ? 'owned' : ''}">
          <div class="store-card-top">
            <span class="store-cat-pill">${it.cat}</span>
            <span class="store-price-pill">${it.cost} PTS</span>
          </div>
          <div class="store-icon">${it.icon}</div>
          <h4 class="store-name">${it.name}</h4>
          <p class="store-desc">${it.desc}</p>
          <button class="${isOwned ? 'btn-ghost' : 'btn-primary'} small full-width" data-buy-item="${it.id}" ${isOwned ? 'disabled' : ''}>
            ${isOwned ? 'Куплено ✓' : `Обменять за ${it.cost} PTS`}
          </button>
        </div>
      `;
    }).join('');

    grid.querySelectorAll('[data-buy-item]').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = STORE_ITEMS.find(x => x.id === btn.dataset.buyItem);
        if (!item) return;
        const res = window.GrafikaAuth.spendPoints(item.id, item.cost, item.name);
        if (!res.ok) {
          if (window.GrafikaShowToast) window.GrafikaShowToast(res.error);
          return;
        }
        const u = window.GrafikaAuth.getCurrentUser();
        if (u) {
          if (item.type === 'hint' && item.hintKey) {
            u.hintsInventory[item.hintKey] = (u.hintsInventory[item.hintKey] || 0) + 1;
          } else if (item.type === 'frame' && item.frameClass) {
            u.avatarFrame = item.frameClass;
          }
          window.GrafikaAuth.saveCurrentUser(u);
        }
        if (window.GrafikaShowToast) window.GrafikaShowToast(`Успешно приобретено: ${item.name}!`);
        syncAllAccountUI();
        renderPointsStore();
      });
    });
  }

  // ==========================================================================
  // RENDERERS: 5. FULL STUDENT ACCOUNT & ANALYTICS PAGE
  // ==========================================================================
  function renderStudentAccountPage() {
    const user = window.GrafikaAuth.getCurrentUser();
    if (!user) return;

    const fullName = `${user.firstName} ${user.lastName}`;
    const initials = `${(user.firstName || 'С')[0]}${(user.lastName || '')[0]}`.toUpperCase();

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('acc-fullname', fullName);
    set('acc-email', user.email);
    set('acc-inst', user.institution || '—');
    set('acc-group', user.group || '—');
    set('acc-regdate', user.createdAt || '2026-11-23');
    set('acc-level', `УРОВЕНЬ ${user.level || 1}`);
    set('acc-points', `${user.points || 0} PTS`);
    set('acc-role-badge', user.role === 'teacher' ? 'ПРЕПОДАВАТЕЛЬ (НЕИЗМЕНЯЕМО)' : 'СТУДЕНТ (НЕИЗМЕНЯЕМО)');

    const avatarEl = document.getElementById('acc-avatar-circle');
    if (avatarEl) {
      avatarEl.textContent = initials;
      avatarEl.className = `acc-avatar-circle ${user.avatarFrame || ''}`;
    }

    const grades = user.gradesHistory || [];
    const avg = grades.length ? Math.round(grades.reduce((s, g) => s + g.resultPct, 0) / grades.length) : 0;
    const best = grades.length ? Math.max(...grades.map(g => g.resultPct)) : 0;
    const compPct = Math.round(((user.completedLessons || []).length / EDU_LESSONS.length) * 100);

    set('acc-stat-lessons', `${(user.completedLessons || []).length} / ${EDU_LESSONS.length}`);
    set('acc-stat-tasks', `${grades.length}`);
    set('acc-stat-avg', `${avg}%`);
    set('acc-stat-best', `${best}%`);
    set('acc-stat-course', `${compPct}%`);

    // Grades Table
    const tbody = document.getElementById('acc-grades-tbody');
    if (tbody) {
      tbody.innerHTML = grades.map((g, i) => `
        <tr class="grade-row-click" data-grade-idx="${i}">
          <td><strong>${g.lessonTitle}</strong></td>
          <td>${g.taskTitle}</td>
          <td class="mono-muted">${g.date}</td>
          <td><strong>${g.resultPct}%</strong></td>
          <td>${g.gradeLabel}</td>
          <td class="accent-cyan">+${g.pointsAwarded} PTS</td>
          <td><span class="status-chip ${g.status}">${g.status === 'done' ? 'Выполнено' : 'Повторить'}</span></td>
        </tr>
      `).join('') || '<tr><td colspan="7" class="mono-muted">Пока нет оценённых работ. Пройдите практику в разделе «Уроки».</td></tr>';

      tbody.querySelectorAll('[data-grade-idx]').forEach(tr => {
        tr.addEventListener('click', () => {
          const g = grades[parseInt(tr.dataset.gradeIdx, 10)];
          const detailBox = document.getElementById('acc-grade-detail');
          if (detailBox && g) {
            detailBox.style.display = 'block';
            detailBox.innerHTML = `
              <strong>Разбор работы: ${g.taskTitle} (${g.resultPct}%)</strong><br/>
              <span>Сильные стороны: ${g.strengths}</span><br/>
              <span>Ошибки: ${g.errors}</span><br/>
              <span class="accent-cyan">Рекомендация: ${g.recommendation}</span>
            `;
          }
        });
      });
    }

    // Strengths & Difficulties
    const strEl = document.getElementById('acc-strengths-list');
    const diffEl = document.getElementById('acc-difficulties-list');
    const topicStats = user.topicStats || {};
    const entries = Object.entries(topicStats);
    if (strEl) {
      const strong = entries.filter(([, v]) => v >= 80);
      strEl.innerHTML = (strong.length ? strong : [['Геометрические фигуры', 92]]).map(([k, v]) => `
        <div class="topic-bar-row">
          <div class="tb-head"><span>${k}</span><strong>${v}%</strong></div>
          <div class="tb-track"><div class="tb-fill" style="width:${v}%"></div></div>
        </div>
      `).join('');
    }
    if (diffEl) {
      const weak = entries.filter(([, v]) => v < 80);
      diffEl.innerHTML = (weak.length ? weak : [['Чтение скрытых контуров', 72]]).map(([k, v]) => `
        <div class="diff-advice-card">
          <div class="tb-head"><strong>${k}</strong><span class="mono-muted">${v}%</span></div>
          <p>Рекомендуем повторить интерактивный урок по теме «${k}» и выполнить ещё одно упражнение в тренажёре.</p>
        </div>
      `).join('');
    }

    // Points Ledger
    const ledgerEl = document.getElementById('acc-points-ledger');
    if (ledgerEl) {
      ledgerEl.innerHTML = (user.pointsLedger || []).slice(0, 10).map(l => `
        <div class="ledger-row">
          <span>${l.action} <small class="mono-muted">(${l.date})</small></span>
          <strong class="${l.delta >= 0 ? 'accent-cyan' : ''}">${l.delta >= 0 ? '+' : ''}${l.delta} PTS</strong>
        </div>
      `).join('');
    }

    // Draw Grades Bar Chart
    const cv = document.getElementById('acc-grades-chart');
    if (cv) {
      const ctx = cv.getContext('2d');
      const w = cv.width, h = cv.height;
      ctx.clearRect(0, 0, w, h);
      const tc = window.GrafikaAlbumAndTheme.getActiveTheme().canvas;
      const items = grades.slice(0, 6).reverse();
      if (items.length === 0) return;

      const pad = 34;
      const barW = Math.min(46, (w - pad * 2) / items.length - 12);
      ctx.strokeStyle = tc.gridLine;
      for (let g = 0; g <= 100; g += 25) {
        const y = h - pad - (g / 100) * (h - pad * 2);
        ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(w - 14, y); ctx.stroke();
      }
      items.forEach((it, idx) => {
        const x = pad + 14 + idx * ((w - pad * 2) / items.length);
        const bh = (it.resultPct / 100) * (h - pad * 2);
        const y = h - pad - bh;
        ctx.fillStyle = tc.meshAccent;
        ctx.fillRect(x, y, barW, bh);
        ctx.fillStyle = tc.inkMain;
        ctx.font = '700 10px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${it.resultPct}%`, x + barW / 2, y - 6);
        ctx.fillStyle = tc.inkMuted;
        ctx.fillText(`#${idx + 1}`, x + barW / 2, h - 14);
      });
    }
  }

  // ==========================================================================
  // RENDERERS: 6. TEACHER DASHBOARD (GROUPS, ASSIGNMENTS, GRADING, ANALYTICS)
  // ==========================================================================
  function renderTeacherDashboard() {
    const user = window.GrafikaAuth.getCurrentUser();
    const container = document.getElementById('teacher-dashboard-root');
    if (!container) return;

    if (!user || user.role !== 'teacher') {
      container.innerHTML = `<div class="dash-card"><p>Доступ к Teacher Dashboard открыт только для аккаунтов с ролью «Преподаватель».</p></div>`;
      return;
    }

    const status = user.verificationStatus || 'Pending';
    const isVerified = status === 'Verified';
    const tData = window.GrafikaAuth.loadTeacherData();

    const totalStudents = tData.groups.reduce((s, g) => s + g.students.length, 0);
    const pendingSubs = tData.submissions.filter(s => s.status === 'pending_review').length;
    const allScores = tData.groups.flatMap(g => g.students.map(st => st.avgScore));
    const avgGroupScore = allScores.length ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0;

    container.innerHTML = `
      <!-- Teacher Verification Status Banner (Explicitly Marked DEMO) -->
      <div class="teacher-verify-banner status-${status.toLowerCase()}">
        <div>
          <span class="tech-badge orange">СТАТУС ПОДТВЕРЖДЕНИЯ (DEMO): ${status.toUpperCase()}</span>
          <h3>${user.firstName} ${user.lastName} — ${user.position} (${user.institution})</h3>
          <p class="mono-muted">
            ${isVerified
              ? 'Преподавательский статус подтверждён. Доступны создание групп, выдача заданий, оценивание и аналитика.'
              : status === 'Rejected'
                ? 'Заявка отклонена. Полный доступ к преподавательским инструментам заблокирован.'
                : 'Заявка на подтверждение статуса преподавателя ожидает проверки администратором (Pending). Полный доступ временно ограничен.'}
          </p>
        </div>
        <div class="demo-verify-controls">
          <span class="mono-muted">DEMO-переключатель проверки (для тестирования):</span>
          <div class="demo-v-btns">
            <button class="mini-btn" data-demo-v="Verified">✓ Подтвердить (Verified)</button>
            <button class="mini-btn" data-demo-v="Pending">⏳ Pending</button>
            <button class="mini-btn" data-demo-v="Rejected">✕ Rejected</button>
          </div>
        </div>
      </div>

      ${!isVerified ? `
        <div class="dash-card teacher-locked-card">
          <h3>🔒 Инструменты преподавателя ограничены до подтверждения статуса</h3>
          <p>Пока ваш статус <strong>${status}</strong>, вы не можете создавать учебные группы, выдавать задания и выставлять оценки. В демонстрационном режиме вы можете подтвердить заявку кнопкой <strong>«✓ Подтвердить (Verified)»</strong> выше.</p>
        </div>
      ` : `
        <!-- KPI Summary Row -->
        <div class="teacher-kpi-grid">
          <div class="stat-box"><span class="stat-val accent-cyan">${tData.groups.length}</span><span class="stat-lbl">Учебных групп</span></div>
          <div class="stat-box"><span class="stat-val">${totalStudents}</span><span class="stat-lbl">Всего студентов</span></div>
          <div class="stat-box"><span class="stat-val accent-orange">${tData.assignments.length}</span><span class="stat-lbl">Активных заданий</span></div>
          <div class="stat-box"><span class="stat-val accent-cyan">${avgGroupScore}%</span><span class="stat-lbl">Средний балл групп</span></div>
          <div class="stat-box"><span class="stat-val">${pendingSubs}</span><span class="stat-lbl">Ожидают проверки</span></div>
        </div>

        <div class="teacher-main-grid">
          <!-- GROUPS MANAGEMENT -->
          <div class="dash-card">
            <div class="panel-title">УЧЕБНЫЕ ГРУППЫ И КОДЫ ПРИСОЕДИНЕНИЯ</div>
            <form id="tch-create-group-form" class="tch-inline-form">
              <input type="text" id="tch-grp-name" placeholder="Название группы (напр. ИГ-301)" required />
              <input type="text" id="tch-grp-course" placeholder="Курс / Дисциплина" required />
              <button type="submit" class="btn-primary small">+ Создать группу</button>
            </form>
            <div class="tch-groups-list">
              ${tData.groups.map(g => `
                <div class="tch-group-card">
                  <div class="tch-grp-head">
                    <div>
                      <strong>${g.name}</strong>
                      <div class="mono-muted">${g.course} • Студентов: ${g.students.length}</div>
                    </div>
                    <div class="tch-code-box">
                      <span>Код: <strong>${g.code}</strong></span>
                      <button class="mini-btn" data-toggle-code="${g.id}">${g.codeActive ? 'Отключить код' : 'Включить код'}</button>
                    </div>
                  </div>
                  <div class="tch-students-mini">
                    ${g.students.map(st => `
                      <div class="tch-st-row">
                        <span>${st.name} ${st.needsHelp ? '<em class="help-tag">нужна помощь</em>' : ''}</span>
                        <span class="mono-muted">${st.completed}/${st.total} зад. • <strong>${st.avgScore}%</strong></span>
                      </div>
                    `).join('')}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- CREATE ASSIGNMENTS + SUBMISSIONS GRADING -->
          <div class="dash-card">
            <div class="panel-title">ВЫДАТЬ НОВОЕ ЗАДАНИЕ ГРУППЕ</div>
            <form id="tch-create-asg-form" class="tch-asg-form">
              <div class="form-row-2">
                <select id="tch-asg-topic">
                  <option value="Геометрические фигуры">Геометрические фигуры</option>
                  <option value="Ортогональные проекции">Ортогональные проекции</option>
                  <option value="Изометрия">Изометрия</option>
                  <option value="Размеры ГОСТ">Размеры ГОСТ</option>
                </select>
                <select id="tch-asg-diff">
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
              <div class="form-row-2">
                <input type="text" id="tch-asg-title" placeholder="Название задания" required />
                <select id="tch-asg-group">
                  ${tData.groups.map(g => `<option value="${g.id}">${g.name}</option>`).join('')}
                </select>
              </div>
              <input type="text" id="tch-asg-instr" placeholder="Инструкция для студентов" required />
              <div class="form-row-2">
                <input type="date" id="tch-asg-due" value="2026-12-05" required />
                <button type="submit" class="btn-primary small">Назначить задание группе</button>
              </div>
            </form>

            <div class="panel-title" style="margin-top:18px;">РАБОТЫ НА ПРОВЕРКЕ И ОЦЕНИВАНИЕ</div>
            <div class="tch-subs-list">
              ${tData.submissions.map(sub => `
                <div class="tch-sub-card">
                  <div class="tch-grp-head">
                    <div>
                      <strong>${sub.studentName}</strong> <span class="mono-muted">(${sub.groupName})</span>
                      <div class="mono-muted">${sub.taskTitle} • ${sub.submittedAt}</div>
                    </div>
                    <span class="status-chip ${sub.status === 'graded' ? 'done' : 'pending'}">
                      ${sub.status === 'graded' ? `Оценка: ${sub.grade}%` : 'Ожидает проверки'}
                    </span>
                  </div>
                  <p class="tch-sub-summary">${sub.workSummary}</p>
                  ${sub.status === 'graded'
                    ? `<div class="mono-muted">Комментарий: ${sub.comment}</div>`
                    : `
                      <div class="tch-grade-inline">
                        <input type="number" min="0" max="100" value="88" id="grade-val-${sub.id}" style="width:72px;" />
                        <input type="text" placeholder="Комментарий преподавателя..." id="grade-cmt-${sub.id}" />
                        <button class="btn-primary small" data-grade-sub="${sub.id}">Выставить оценку</button>
                      </div>
                    `}
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `}
    `;

    // Bind DEMO verification status buttons
    container.querySelectorAll('[data-demo-v]').forEach(btn => {
      btn.addEventListener('click', () => {
        user.verificationStatus = btn.dataset.demoV;
        window.GrafikaAuth.saveCurrentUser(user);
        if (window.GrafikaShowToast) window.GrafikaShowToast(`DEMO: Статус преподавателя изменён на ${user.verificationStatus}`);
        renderTeacherDashboard();
      });
    });

    const grpForm = document.getElementById('tch-create-group-form');
    if (grpForm) {
      grpForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('tch-grp-name').value.trim();
        const course = document.getElementById('tch-grp-course').value.trim();
        const code = 'GL-' + Math.floor(100 + Math.random() * 900);
        tData.groups.unshift({ id: 'grp_' + Date.now(), name, course, code, codeActive: true, students: [] });
        window.GrafikaAuth.saveTeacherData(tData);
        if (window.GrafikaShowToast) window.GrafikaShowToast(`Группа «${name}» создана! Код: ${code}`);
        renderTeacherDashboard();
      });
    }

    container.querySelectorAll('[data-toggle-code]').forEach(btn => {
      btn.addEventListener('click', () => {
        const g = tData.groups.find(x => x.id === btn.dataset.toggleCode);
        if (g) {
          g.codeActive = !g.codeActive;
          window.GrafikaAuth.saveTeacherData(tData);
          renderTeacherDashboard();
        }
      });
    });

    const asgForm = document.getElementById('tch-create-asg-form');
    if (asgForm) {
      asgForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const grpId = document.getElementById('tch-asg-group').value;
        const grp = tData.groups.find(g => g.id === grpId);
        tData.assignments.unshift({
          id: 'asg_' + Date.now(),
          topic: document.getElementById('tch-asg-topic').value,
          title: document.getElementById('tch-asg-title').value.trim(),
          difficulty: document.getElementById('tch-asg-diff').value,
          groupId: grpId,
          groupName: grp ? grp.name : 'Группа',
          instructions: document.getElementById('tch-asg-instr').value.trim(),
          deadline: document.getElementById('tch-asg-due').value
        });
        window.GrafikaAuth.saveTeacherData(tData);
        if (window.GrafikaShowToast) window.GrafikaShowToast('Задание успешно назначено учебной группе!');
        renderTeacherDashboard();
      });
    }

    container.querySelectorAll('[data-grade-sub]').forEach(btn => {
      btn.addEventListener('click', () => {
        const sub = tData.submissions.find(x => x.id === btn.dataset.gradeSub);
        if (!sub) return;
        const val = Math.max(0, Math.min(100, parseInt(document.getElementById(`grade-val-${sub.id}`).value, 10) || 85));
        const cmt = document.getElementById(`grade-cmt-${sub.id}`).value.trim() || 'Проверено преподавателем.';
        sub.grade = val;
        sub.comment = cmt;
        sub.status = 'graded';
        window.GrafikaAuth.saveTeacherData(tData);
        if (window.GrafikaShowToast) window.GrafikaShowToast(`Оценка ${val}% выставлена для ${sub.studentName}`);
        renderTeacherDashboard();
      });
    });
  }

  // ==========================================================================
  // SYNC TOPBAR & ROLE-SPECIFIC UI
  // ==========================================================================
  function syncAllAccountUI() {
    const user = window.GrafikaAuth.getCurrentUser();
    if (!user) return;

    const isTeacher = user.role === 'teacher';
    const fullName = `${user.firstName} ${user.lastName}`;
    const initials = `${(user.firstName || 'U')[0]}${(user.lastName || '')[0]}`.toUpperCase();

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('header-lvl', user.level || 1);
    set('header-xp', `${user.points || 0}`);
    set('header-role-badge', isTeacher ? 'ПРЕП' : initials);
    set('header-user-name', fullName);
    set('topbar-role-sub', isTeacher ? 'КАБИНЕТ ПРЕПОДАВАТЕЛЯ' : 'КАБИНЕТ СТУДЕНТА');

    // Show/hide Teacher nav tab strictly according to immutable account role
    const teacherNavBtn = document.querySelector('[data-nav="teacher"]');
    if (teacherNavBtn) teacherNavBtn.style.display = isTeacher ? 'flex' : 'none';
    const storeNavBtn = document.querySelector('[data-nav="store"]');
    if (storeNavBtn) storeNavBtn.style.display = isTeacher ? 'none' : 'flex';

    // Update Home Welcome Strip & Home Statistics Card from real user account
    set('rws-badge', isTeacher ? `ПРЕПОДАВАТЕЛЬ (${user.verificationStatus})` : `СТУДЕНТ • ${user.group}`);
    set('rws-greeting', `Добро пожаловать, ${fullName}!`);
    set('rws-course', isTeacher ? `${user.institution} • ${user.subject}` : `${user.institution} • Баланс: ${user.points || 0} Graphica Points`);

    const grades = user.gradesHistory || [];
    const avg = grades.length ? Math.round(grades.reduce((s, g) => s + g.resultPct, 0) / grades.length) : 0;
    set('stat-lessons', `${(user.completedLessons || []).length} / ${EDU_LESSONS.length}`);
    set('stat-tasks', `${grades.length}`);
    set('stat-xp', `${user.points || 0} PTS`);
    set('stat-level', `УРОВЕНЬ ${user.level || 1}`);
    set('stat-accuracy', `${avg}%`);
    set('stat-rank-label', isTeacher ? (user.position || 'Преподаватель') : 'Студент лаборатории');

    // Update Student Account & Store & Teacher views
    renderStudentAccountPage();
    renderPointsStore();
    if (isTeacher) renderTeacherDashboard();
  }

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================
  function initEduPlatform() {
    // Filter buttons in Geometry Figures Catalog
    document.querySelectorAll('[data-fig-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-fig-filter]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeFigureFilter = btn.dataset.figFilter;
        renderFiguresCatalog();
      });
    });

    // Guided Build controls
    const gbAddBlock = document.getElementById('gb-btn-add-block');
    const gbAddTop = document.getElementById('gb-btn-add-top');
    const gbAddCyl = document.getElementById('gb-btn-add-cyl');
    const gbOrbitBtn = document.getElementById('gb-btn-orbit');
    const gbHintBtn = document.getElementById('gb-btn-hint');
    const gbRepeatBtn = document.getElementById('gb-btn-repeat');
    const gbNextBtn = document.getElementById('gb-next-btn');

    if (gbAddBlock) {
      gbAddBlock.addEventListener('click', () => {
        if (gbState.parts.length === 0) {
          gbState.parts.push({ type: 'block', gx: 0, gy: 0, gz: 0, w: 60, d: 40, h: 40 });
        }
        renderGuidedBuildUI();
      });
    }
    if (gbAddTop) {
      gbAddTop.addEventListener('click', () => {
        if (gbState.parts.length === 0) {
          gbState.parts.push({ type: 'cube', gx: 0, gy: 0, gz: 0, w: 40, d: 40, h: 40 });
        } else {
          const base = gbState.parts[0];
          gbState.parts.push({ type: 'cube', gx: -0.5, gy: 0, gz: base.h / 40, w: 40, d: 40, h: 40 });
        }
        renderGuidedBuildUI();
      });
    }
    if (gbAddCyl) {
      gbAddCyl.addEventListener('click', () => {
        const zOff = gbState.parts.length ? gbState.parts[0].h / 40 : 0;
        gbState.parts.push({ type: 'cylinder', gx: 0, gy: 0, gz: zOff, w: 36, d: 36, h: 44 });
        renderGuidedBuildUI();
      });
    }
    if (gbOrbitBtn) {
      gbOrbitBtn.addEventListener('click', () => {
        gbState.yaw += 0.75;
        gbState.hasOrbited = true;
        renderGuidedBuildUI();
      });
    }
    if (gbHintBtn) {
      gbHintBtn.addEventListener('click', () => {
        const hb = document.getElementById('gb-step-hint-box');
        if (hb) hb.style.display = hb.style.display === 'none' ? 'block' : 'none';
      });
    }
    if (gbRepeatBtn) {
      gbRepeatBtn.addEventListener('click', () => startGuidedTutorial(gbState.tutorialIdx));
    }
    if (gbNextBtn) {
      gbNextBtn.addEventListener('click', () => {
        const tut = GUIDED_TUTORIALS[gbState.tutorialIdx];
        if (gbState.stepIdx < tut.steps.length - 1) {
          gbState.stepIdx++;
          renderGuidedBuildUI();
        } else {
          const res = window.GrafikaAuth.awardPoints(`guided:${tut.id}`, 15, `Построение по шагам: ${tut.title}`);
          if (window.GrafikaShowToast) {
            window.GrafikaShowToast(res.duplicate ? 'Построение завершено!' : '+15 Graphica Points за пошаговое 3D-построение!');
          }
          syncAllAccountUI();
          startGuidedTutorial((gbState.tutorialIdx + 1) % GUIDED_TUTORIALS.length);
        }
      });
    }

    // Numeric W/H/D inputs in Guided Build
    ['gb-input-w', 'gb-input-h', 'gb-input-d'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', () => {
          if (gbState.parts.length === 0) return;
          gbState.parts[0].w = Math.max(20, Math.min(100, parseInt(document.getElementById('gb-input-w').value, 10) || 40));
          gbState.parts[0].h = Math.max(20, Math.min(80, parseInt(document.getElementById('gb-input-h').value, 10) || 40));
          gbState.parts[0].d = Math.max(20, Math.min(80, parseInt(document.getElementById('gb-input-d').value, 10) || 40));
          renderGuidedBuildUI();
        });
      }
    });

    // Guided Build 3D mouse orbit
    const gbCv = document.getElementById('guided-3d-canvas');
    if (gbCv) {
      gbCv.addEventListener('mousedown', (e) => {
        gbState.isDragging = true;
        gbState.lastX = e.clientX;
        gbState.lastY = e.clientY;
      });
      window.addEventListener('mousemove', (e) => {
        if (!gbState.isDragging) return;
        gbState.yaw += (e.clientX - gbState.lastX) * 0.009;
        gbState.pitch = Math.max(-1.1, Math.min(1.3, gbState.pitch + (e.clientY - gbState.lastY) * 0.009));
        gbState.lastX = e.clientX;
        gbState.lastY = e.clientY;
        if (!gbState.hasOrbited) {
          gbState.hasOrbited = true;
          renderGuidedBuildUI();
        } else {
          renderGuidedCanvas();
        }
      });
      window.addEventListener('mouseup', () => { gbState.isDragging = false; });
    }

    // Tutorial selector buttons
    document.querySelectorAll('[data-gb-select]').forEach(btn => {
      btn.addEventListener('click', () => {
        startGuidedTutorial(parseInt(btn.dataset.gbSelect, 10));
      });
    });

    // Re-render canvases on theme change
    window.addEventListener('grafika:themechange', () => {
      renderFiguresCatalog();
      renderGuidedCanvas();
      renderLessonsView();
      renderStudentAccountPage();
    });

    renderFiguresCatalog();
    startGuidedTutorial(0);
    renderLessonsView();
    renderPointsStore();
    syncAllAccountUI();
  }

  return {
    initEduPlatform,
    syncAllAccountUI,
    renderFiguresCatalog,
    renderGuidedBuildUI,
    renderLessonsView,
    renderPointsStore,
    renderStudentAccountPage,
    renderTeacherDashboard
  };
})();
