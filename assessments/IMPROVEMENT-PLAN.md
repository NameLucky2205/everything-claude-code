# everything-claude-code — план доработок

> Составлен многоагентным анализом (9 измерений + синтез), заземлён на файлы репозитория.
> Полный машиночитаемый список — [ecc-findings.json](ecc-findings.json) (48 находок:
> 1 critical, 20 high, 19 medium, 8 low).

## Статус исполнения

Применено в этой серии PR (всё проходит `scripts/ci/validate-*` и count-check):

| Фаза | Сделано | Отложено (с причиной) |
|---|---|---|
| 0 | шимы `tdd/e2e/orchestrate` → редиректы; `code-reviewer` MUST BE USED → fallback; `CLAUDE.md`/`REPO-ASSESSMENT.md` — битые ссылки/устаревшие счётчики; ревьюеры read-only; ребаланс моделей | один lockfile — **откачено**: `package-lock.json` несущий для `npm ci` в 6+ CI-джобах и тестах, нужна координированная npm→yarn миграция; `rules/zh` — ссылается из install-тестов; `continuous-learning` v1 — вшит в hook `evaluate-session.js` |
| 1 | `INSTALL.md` — единый канонический путь + дерево решений + «не стекать методы». **PR #2:** привязка **48 сирот-скилов** в module-graph (3 новых модуля healthcare/homelab/design-motion + раскладка по темам) и синхронизация `files[]` — «49 неопубликованных» закрыто через граф, а не glob (`npm-publish-surface` 2/2). `skill-comply` намеренно оставлен вне графа (CI-only, зафиксировано контрактом pack) | `configure-ecc` rewrite — отдельный PR |
| 2 | `scripts/ci/validate-drift.js` + подключён в CI; **нашёл и убрал реальный дрейф** (2 osiротевших перевода `project-guidelines-example`) | полные генераторы зеркал/переводов из канона — большой отдельный этап |
| 3 | проектный документ [PHASE-3-CONSOLIDATION.md](PHASE-3-CONSOLIDATION.md) | само слияние 19→6 ревьюеров и 10→1 резолверов — меняет авто-диспатч, нужен eval-паритет и compat-окно, по явному согласию |
| 4 | `CATALOG.md` + генератор `scripts/ci/catalog-index.js` + CI-check | TS/Node-скилы (связаны со счётчиками в README/AGENTS/plugin.json); разбиение README |
| 5 | `LAYOUT.md` (классификация всех каталогов); `WORKING-CONTEXT.md` → `archive/` | вынос `src/llm`, `ecc2/`, `ecc_dashboard.py` — cross-repo |

Принцип отбора: применено всё безопасное/аддитивное/проверяемое; отложено — то, что меняет
поведение, ломает CI, либо требует просмотра диффа владельцем. Отложенное — не «не сделано», а
готовые к исполнению следующие PR.

## Главное за 30 секунд

**Счётчики раздуты примерно втрое.** Заявлено 207 агентов / 573 скила / 319 команд / 302
правила. Реальный **канонический** объём — **~60 агентов / 229 скилов / 75 команд / ~99
governance-правил**. Остальное — это:
- **282 переведённых копии** `SKILL.md` в `docs/<locale>` (zh-CN 181, tr 38, ja-JP 32, …);
- **5 зеркал под другие харнессы** (`.cursor/.kiro/.agents/.opencode/.claude`);
- матрица переводов правил на 6 языков + устаревший `.cursor/rules`.

**Ни одна из этих копий не генерируется трекнутым пайплайном** — значит они уже расходятся
(часть байт-в-байт, часть с дрейфом тела), каждую правку канона надо руками разносить по N
местам, а раздутые числа создают ложный вывод «ECC неподъёмно большой».

## Что сделано хорошо (не ломать)

- **Прогрессивная загрузка корректна**: тела скилов/агентов/команд грузятся по требованию;
  всегда в контексте только меню имя+описание (~22.6K токенов на полной установке) и правила.
- **Слоистость канонических правил инженерно верна**: `paths:`-скоуп грузит языковые правила
  только под подходящие файлы, каждый язык ссылается на `common/…`, дельты содержательны.
- **Least-privilege в основном соблюдён**: 17 из 19 ревьюеров read-only (только 2 исключения).
- **Полнота frontmatter**: все 60 канонических агентов объявляют name/description/tools/model.
- **Курационные инструменты зрелые**: `agent-sort` (DAILY/LIBRARY по grep), `/project-init`
  (dry-run из маппинга стеков), `skill-stocktake/scout/comply`, `install-plan.js`, `catalog.js`
  (CI-гард на счётчики). Направление «скилы — основная поверхность, команды — шимы» разумное.
- **Глубокий длинный хвост** (сети/homelab, supply-chain, healthcare, научка, web3) — реальная
  ценность для этих аудиторий, если правильно выставить в каталог.

## Восемь тем (по приоритету)

| Приоритет | Тема |
|---|---|
| CRITICAL | Нет единого источника правды для мультиинструментальной поверхности (зеркала+переводы дрейфуют) |
| CRITICAL | Противоречивый install/onboarding с граблями (устаревший `configure-ecc` против managed-инсталлера) |
| HIGH | Дублирующий per-language fan-out агентов/команд/скилов — налог на поддержку и размытие селекции |
| HIGH | Недетерминированный авто-диспатч (11 ревьюеров с `MUST BE USED` без приоритета) |
| HIGH | Переоснащение по правам: `security-reviewer` и `database-reviewer` — единственные ревьюеры с Write/Edit |
| HIGH | Загрязнение always-on контекста на уровне глобальной установки (две версии common-правил + китайские переводы) |
| MEDIUM | Инвертированные инвестиции в покрытие vs реальные стеки (TS/JS — №1 — 0 скилов) |
| MEDIUM | Гигиена структуры репо и документации |

## Дорожная карта

### Фаза 0 — Быстрые победы: безопасность и корректность (сразу) · quick-win
Закрыть дешёвые high-дефекты без изменения архитектуры.
- Убрать `Write`/`Edit` у `agents/security-reviewer.md` и `agents/database-reviewer.md` — все 19
  ревьюеров read-only. Нужна применяющая правки вариация — вынести отдельным агентом.
- В глобальной установке удалить устаревшее Gen1-дерево `~/.claude/rules/common`, оставить только
  Gen2 `ecc/`; не ставить ни один набор переводов (`zh/`, `docs/<locale>`) в активные правила.
- Удалить `rules/zh` из канона — переводы только под `docs/<locale>`.
- Удалить `package-lock.json`, оставить `yarn.lock` (packageManager yarn@4.9.2), переключить
  `install.sh` на yarn/corepack.
- Урезать три нетронутых legacy-шима (`commands/tdd.md` 231, `e2e.md` 268, `orchestrate.md` 135)
  до header-only редиректов.
- Убрать deprecated-скил `continuous-learning` из устанавливаемого набора (редирект на v2);
  политика «deprecated ⇒ не ставится».
- Починить/удалить `REPO-ASSESSMENT.md` (там всё ещё v1.9.0-счётчики), убрать несуществующие
  `/readme` и `/ci-workflow` из `CLAUDE.md`.

### Фаза 1 — Починить install/onboarding и манифесты · medium
Один надёжный путь установки; managed-инсталлер покрывает весь каталог.
- Переписать `configure-ecc` на чтение живого каталога (`scripts/ci/catalog.js`) и вызов
  `install-plan.js` + `install-apply.js` — или убрать его и роутить «configure ecc» на
  `/project-init` + `agent-sort`. Двух движков установки быть не должно.
- Выбрать ОДИН канонический путь, опубликовать `INSTALL.md` (дерево решений), остальное — в
  «Alternatives»; починить рассинхрон `npx ecc-universal install` vs бинарь `ecc-install`.
- Привязать 49 «сиротских» скилов к модулям в `manifests/install-modules.json` (добавить модули
  healthcare/design-motion/frontend-web/homelab по нужде) + CI-проверка «скил без модуля = fail».
- Заменить ручной `package.json files[]` (сейчас 180 из 229) на glob `skills/` + `.npmignore`
  или генерацию из манифестов с CI-паритетом.
- Свести курацию в один путь: `/project-init` (детект стека) → `agent-sort` (DAILY/LIBRARY) →
  managed-инсталлер; хэндофф `agent-sort` направить на инсталлер, не на `configure-ecc`.

### Фаза 2 — Единый источник правды + генерация всех копий · large
Сделать `agents/`, `skills/`, `commands/`, `rules/` единственной руками-правимой поверхностью;
всё остальное генерировать с CI-контролем дрейфа.
- Добавить коммитнутые генераторы `build-<harness>`, регенерящие зеркала
  `.cursor/.kiro/.agents/.opencode/.claude` и переводы `docs/<locale>` из канона; удалить
  ручные копии.
- CI-джоб: регенерировать все зеркала/переводы и падать на любом diff от канона.
- Снять живой `tools:`/`model:`/`name:` frontmatter с переведённых копий (или вынести переводы в
  docs-only `i18n/`), чтобы glob по `docs/**/agents` не коллизил на дублях `name:`.
- Генерировать `.cursor/rules/` из `rules/` (flatten + Cursor-frontmatter), добавить
  недостающие домены или явно ограничить зеркало.
- Везде в публичной отчётности — канонические числа (60/229/75), из `catalog.js`.

### Фаза 3 — Консолидация дубляжа + детерминированный диспатч · large
Схлопнуть per-language шаблоны в стек-детектящие параметрические компоненты; дать селектору
явный приоритет — меньше поддержки И точнее выбор.
- 19 ревьюеров → один стек-детектящий `code-reviewer`, тянущий языковые критерии из
  `rules/<lang>`; оставить только ортогональные (security, healthcare, database).
- Снять blanket `MUST BE USED` с языковых ревьюеров; роутить по детекту языка через один
  диспатчер (или команду `/code-review`) с явным приоритетом.
- 10 build-resolver'ов → один `build-error-resolver` с детектом тулчейна из упавшей команды;
  переименовать мислейбл-generic (это TS/JS-резолвер), стандартизировать имена.
- Per-language триады команд → три стек-осознанных generic (`/build`, `/test`, `/review`) из
  `config/project-stack-mappings.json`; добавить язык = правка rules-пака.
- Квартеты verification/tdd (django/laravel/springboot/quarkus) → тонкие дельты поверх generic
  `verification-loop`/`tdd-workflow`; 35 `*-patterns` скилов свести по экосистемам с явным
  «use this vs that».
- Развести границы `architect` vs `code-architect` vs `planner` в описаниях (или слить первые два).

### Фаза 4 — Обнаружимость, ребаланс покрытия, стоимость · medium
- `catalog.js --skills-index`: генерить категоризированный `CATALOG.md` из frontmatter (name,
  description, origin, module) + секция Verticals; CI-энфорс. Это тот единственный документ,
  что снимает ощущение «слишком большой».
- Высший ROI покрытия: `typescript-patterns`, `typescript-testing`, `nodejs-patterns` (зеркало
  python/go пар); решить судьбу Ruby/Rails-полосы или пометить Ruby/ArkTS/PHP как rules-only.
- Ребаланс моделей: узкие read-only lookup/analyzer-агенты (docs-lookup, code-explorer,
  comment-analyzer, …) → haiku; пересмотреть, тянет ли gan-* трио на sonnet.
- Разбить README (1732 строки) на lean README + INSTALL.md / HARNESSES.md / CATALOG.md /
  GUIDES.md / FAQ.md; генерируемый `CATALOG.md` — единственный источник счётчиков.

### Фаза 5 — Структура репо и долгая гигиена · large
- `ARCHITECTURE/LAYOUT.md`: классифицировать каждый корневой и dot-каталог (канон-источник /
  генерируемый адаптер / runtime-конфиг / подпроект / build-тулинг).
- Вынести `src/llm` (llm-abstraction) и `ecc2/` (Rust control-plane) в помеченные подпроекты
  или отдельные репо; `ecc_dashboard.py` → `scripts/` или `dashboard/`; починить плейсхолдер
  `affaan@example.com`.
- Датированные session/PR-артефакты (`MEGA-PLAN-*`, `PHASE1-*`, `PR-399-REVIEW`, …) → `archive/`;
  в корне — README/CONTRIBUTING/SECURITY/CHANGELOG/LICENSE.
- Крошечный frontmatter-lint в CI: единый стиль `tools:`, снять кавычки у gan-*-описаний,
  стандартизировать суффикс резолверов.
- Регенерить `rules/README.md` из листинга; выровнять команду установки под реальный инсталлер.
- Исправить формулировку «75 legacy command shims»; задокументировать приоритет skill-first.

## Быстрые победы (можно взять в первый PR)

1. Снять `Write`/`Edit` с `security-reviewer` и `database-reviewer` (все ревьюеры read-only).
2. Удалить Gen1 `~/.claude/rules/common` и перестать инжектить `ecc/zh` в каждую сессию.
3. Удалить `rules/zh` из канона (переводы только в `docs/<locale>`).
4. Удалить `package-lock.json`, `install.sh` → yarn/corepack.
5. Урезать `tdd.md`/`e2e.md`/`orchestrate.md` до header-редиректов.
6. Убрать `continuous-learning` из устанавливаемого набора; политика deprecated⇒не ставится.
7. Починить `REPO-ASSESSMENT.md` и битые ссылки в `CLAUDE.md`.
8. `package.json files[]` (180/229) → glob `skills/` + CI-паритет.
9. Снять blanket `MUST BE USED` с 11 языковых ревьюеров.
10. Узкие lookup/analyzer-агенты → haiku.

## Реестр находок (48)

| Приоритет | Усилие | Измерение | Находка |
|---|---|---|---|
| critical | medium | coverage-docs | configure-ecc устарел и ведёт к дивергентному, не рекомендованному механизму установки |
| high | large | structure | Копии скилов/агентов в tool-dir — производные без генератора, дрейфуют |
| high | quick-win | structure | package.json files[] вручную перечисляет 180 из 229 скилов — 49 не публикуются |
| high | medium | structure | docs/ несёт 282 переведённых SKILL.md, раздувающих счёт до 573 |
| high | medium | agents | 61% из «207 агентов» — переводные дубли, уже дрейфуют |
| high | medium | agents | Конкурирующие MUST BE USED у 19 ревьюеров ⇒ недетерминированный диспатч |
| high | quick-win | agents | security-reviewer и database-reviewer — единственные ревьюеры с Write/Edit |
| high | quick-win | rules | Глобальная установка грузит две версии common-правил (Gen1 + Gen2) |
| high | quick-win | rules | Весь китайский перевод (ecc/zh) инжектится в каждую сессию не-CJK юзеру |
| high | medium | rules | .cursor/rules — устаревшее частичное зеркало канона |
| high | quick-win | commands-hooks | Legacy-шимы не урезаны |
| high | medium | redundancy | Заголовочные счётчики ~3x раздуты зеркалами и переводами |
| high | large | redundancy | 19 per-language ревьюеров — один шаблон со сменой языка |
| high | quick-win | redundancy | 11 ревьюеров с MUST BE USED — конфликт триггеров |
| high | medium | redundancy | Квартеты verification+TDD дублируют generic-скилы, что оборачивают |
| high | medium | coverage-docs | Четыре несогласованных истории установки в разных доках |
| high | medium | coverage-docs | 49 скилов «сироты» — ни один модуль/профиль их не ставит |
| high | medium | coverage-docs | TS/JS (топ веб-стек) — 0 именованных скилов при наличии правил и агента |
| high | quick-win | coverage-docs | Датированные session-артефакты засоряют пользовательскую доку |
| high | medium | coverage-docs | Нет обзорного каталога 229 скилов — вот реальная проблема «размера» |
| medium | large | structure | Корень перегружен тремя несвязанными подпроектами + дашборд |
| medium | quick-win | structure | Два lockfile и рассинхрон npm/yarn между install.sh и packageManager |
| medium | quick-win | structure | docs/ используется как коммитнутый scratchpad датированных заметок |
| medium | medium | structure | Таксономия dot-каталогов перегружена: .claude — runtime, не зеркало |
| medium | medium | agents | Ревьюеры+build-resolver'ы — 50% всех агентов, пересекаются, мислейбл-generic |
| medium | medium | agents | architect vs code-architect vs planner пересекаются без границы |
| medium | quick-win | agents | Модели скошены в sonnet; узкие lookup/analyzer переоснащены |
| medium | quick-win | rules | Китайские правила переведены дважды в двух местах, переводы расходятся |
| medium | large | rules | Ручная матрица переводов на 6 языков (134 файла) с неровным покрытием |
| medium | quick-win | rules | rules/README.md устарел, команда установки не совпадает с инсталлером |
| medium | medium | redundancy | 10 build-resolver + 8 *-build команд — шаблон со сменой языка |
| medium | medium | redundancy | Триады build/test/review на язык дублируют агентов под ними |
| medium | medium | redundancy | Always-on контекст — меню+правила, не тела (ограничено, но реально) |
| medium | large | redundancy | Разрастание pattern-скилов по экосистемам (35 *-patterns) |
| medium | medium | coverage-docs | Полу-построенные полосы: Ruby/Rails, ArkTS, PHP — правила есть, скилов нет |
| medium | large | coverage-docs | Кластеры дубляжа в agent/LLM-meta (36 скилов) и квартетах фреймворков |
| medium | medium | coverage-docs | README — монолит 1732 строки/82KB |
| medium | quick-win | coverage-docs | Формулировка «75 legacy shims» не совпадает с каталогом команд |
| medium | medium | coverage-docs | Курационные инструменты хороши, но раздроблены по слишком многим входам |
| low | quick-win | structure | Устаревшая мета-дока и битые ссылки на скилы в CLAUDE.md |
| low | quick-win | agents | Разнобой стиля frontmatter — следы нескольких copy-paste шаблонов |
| low | medium | skills | (частная заметка по описаниям — см. ecc-findings.json) |
| low | quick-win | rules | «302» раздуто ~200 не-governance файлами; реальный объём ~99 |
| low | quick-win | rules | Каноническая языковая слоистость связна — проверить пару тонких файлов на дельту |
| low | quick-win | redundancy | Deprecated-скил всё ещё поставляется рядом с заменой |
| low | quick-win | security | (мелкая заметка — см. ecc-findings.json) |
| low | medium | coverage-docs | Нишевые вертикали глубоко построены, но и переинвестированы, и плохо находимы |

---
Одно движение с наибольшим рычагом: **сделать канон (60/229/75) единственным руками-правимым
источником и генерировать все зеркала, переводы, `files[]` и `.cursor/rules` с CI-контролем
дрейфа** — это растворяет и раздутые счётчики, и большинство находок про дрейф разом.
