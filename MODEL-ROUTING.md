# Модельная политика ECC — какие модели используют агенты

Как назначаются модели 60 каноническим агентам и почему. Цель: платить за глубину рассуждения
только там, где она реально нужна, а частые узкие read-only задачи отдать дешёвой модели — без
потери качества ревью и генерации.

## Псевдонимы, а не версии

Frontmatter агентов объявляет **tier-псевдоним** (`haiku` / `sonnet` / `opus`), а не конкретную
версию. Псевдоним резолвится в актуальную модель семейства на момент запуска:

| Псевдоним | Резолвится в (актуально) | Роль |
|---|---|---|
| `haiku` | Claude Haiku 4.5 | дёшево и быстро; ~90% качества sonnet на узких задачах |
| `sonnet` | Claude Sonnet 5 | рабочая лошадка: почти всё ревью и генерация |
| `opus` | Claude Opus 5 | глубокое рассуждение, целостный дизайн, высокие ставки |

Поэтому политика **не требует правок при смене поколения моделей** — псевдонимы сами тянут
последнее. Отсюда же вывод: захардкоженные версии в `rules/**/performance.md`
(«Haiku 4.5 / Sonnet 4.6 / Opus 4.5») устарели и должны ссылаться на псевдонимы, а не на номера.

## Принцип назначения

Тир агента = функция от трёх осей:

1. **Когнитивная нагрузка** — открытое проектирование и меж-файловые компромиссы против
   pattern-matching по одному измерению.
2. **Частота вызова** — часто дёргаемый lookup умножает стоимость; узкий и частый ⇒ дешёвый тир.
3. **Ставки ошибки** — клиническая безопасность / архитектурные развилки терпят меньше ошибок ⇒
   верхний тир оправдан.

Дефолт — **sonnet**. Уводим вверх (opus) только за целостное рассуждение и высокие ставки, вниз
(haiku) — только узкие read-only lookup/mapping, где ответ это поиск, а не суждение.

## Раскладка по тирам

### opus (5) — глубокое рассуждение / высокие ставки
| Агент | Почему opus |
|---|---|
| `architect` | системный дизайн с нуля, меж-компонентные компромиссы |
| `planner` | декомпозиция сложных фич и рефакторингов |
| `chief-of-staff` | мультиканальная оркестрация + генерация черновиков с суждением |
| `healthcare-reviewer` | клиническая безопасность / CDSS — цена ошибки максимальна |
| `gan-planner` | разворачивает одну строку в полную спецификацию (генеративно) |

### haiku (5) — узкий read-only lookup / mapping
| Агент | Почему haiku |
|---|---|
| `docs-lookup` | тянет доки через Context7 и форматирует — не суждение |
| `code-explorer` | трассирует пути и картографирует, read-only отчёт |
| `comment-analyzer` | одно измерение: коммент-рот, read-only |
| `conversation-analyzer` | извлекает хук-достойные паттерны из транскрипта |
| `doc-updater` | генерация/обновление codemap и доков (уже был haiku) |

### sonnet (50) — дефолт: инженерное суждение
Все языковые ревьюеры (python/go/rust/ts/java/swift/kotlin/cpp/csharp/fsharp/…), все
build-resolver'ы, `code-reviewer`, `code-architect`, `code-simplifier`, `refactor-cleaner`,
`performance-optimizer`, `security-reviewer`, `database-reviewer`, `tdd-guide`, `e2e-runner`,
`pr-test-analyzer`, `silent-failure-hunter`, `type-design-analyzer`, `mle-reviewer`,
`network-architect`, `homelab-architect`, `network-config-reviewer`, `network-troubleshooter`,
`a11y-architect`, `seo-specialist`, `opensource-*`, `harness-optimizer`, `loop-operator`,
`harmonyos-app-resolver`, `gan-generator`, `gan-evaluator`.

> Границы, которые держим осознанно: `architect`/`planner` — **opus** (открытое проектирование),
> а `code-architect` — **sonnet** (проектирование, заземлённое на существующие паттерны репо).
> Доменные «архитекторы» (network/homelab/a11y) — **sonnet**: дизайн ограничен доменными
> скилами, не открытый.

## Что изменено этим PR

Было **52 sonnet / 7 opus / 1 haiku** → стало **50 sonnet / 5 opus / 5 haiku**.

**Вниз в haiku** (узкие read-only, были sonnet): `docs-lookup`, `code-explorer`,
`comment-analyzer`, `conversation-analyzer`.

**Вниз в sonnet** (были opus): `gan-generator` (пишет код — sonnet и есть кодинг-тир),
`gan-evaluator` (скорит по рубрике через Playwright — структурная оценка). `gan-planner`
оставлен на opus как единственный генеративный шаг триады.

**Без изменений:** opus у `architect`/`planner`/`chief-of-staff`/`healthcare-reviewer`; haiku у
`doc-updater`.

## Как поменять тир агента

Одна строка в его frontmatter:

```yaml
model: haiku   # или sonnet / opus
```

Проверка распределения:

```bash
grep -rhoE '^model:\s*\S+' agents/*.md | sed 's/model:\s*//' | sort | uniq -c | sort -rn
```

## Дальнейший тюнинг (не в этом PR)

- Пересмотреть `harness-optimizer`/`loop-operator` — если они по факту узкие, можно на haiku.
- Когда языковые ревьюеры схлопнутся в один стек-детектящий `code-reviewer` (Фаза 3 плана),
  модельная матрица упростится до горстки записей.
- Актуализировать `rules/**/performance.md`: заменить номера версий на псевдонимы.
