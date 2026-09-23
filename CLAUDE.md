# LifeOS — AI Agent Development Rules

## 0. CRITICAL RULE

This file is the single source of truth for the LifeOS project.

EVERY AI AGENT MUST:

1. Read this file BEFORE starting ANY task.
2. Follow ALL rules in this file.
3. Never silently change the technology stack.
4. Never introduce a new library without explicit approval.
5. Never rewrite working code unnecessarily.
6. Never make architectural decisions that conflict with this document.
7. Before modifying code, understand the existing architecture.
8. After modifying code, verify that the implementation is consistent with these rules.
9. Prefer small, safe, maintainable changes over large rewrites.
10. If a requirement conflicts with this document, STOP and ask for clarification.

The agent must treat this document as persistent project context.

Do NOT assume that information from previous conversations is available.
The repository files and this document are the source of truth.

---

# 1. PROJECT

Project name:

LifeOS

LifeOS is a high-quality personal productivity / life optimization mobile application.

The project is intended to be:

- Production-quality
- Portfolio-quality
- Interview-ready
- Scalable
- Maintainable
- Modern
- Performant
- Type-safe
- Cleanly architected

The goal is NOT to create a simple demo application.

Every feature should be implemented as if it may eventually be used in production.

---

# 2. PRIMARY TECHNOLOGY STACK

## Mobile

React Native CLI

React Native version:

0.86.2

Do NOT migrate to Expo unless explicitly requested.

---

## Language

TypeScript

TypeScript is REQUIRED.

JavaScript files should NOT be introduced for application code.

Prefer:

.ts
.tsx

over:

.js
.jsx

---

# 3. PACKAGE MANAGER

Package manager:

Yarn

Use Yarn commands.

Correct:

yarn add package-name

yarn remove package-name

yarn install

Do NOT use npm unless explicitly requested.

Do NOT mix npm and Yarn in the project.

---

# 4. UI / STYLING

Primary styling system:

NativeWind

Version:

4.2.6

NativeWind is the primary styling solution.

Tailwind CSS:

3.4.x

Current project version:

3.4.19

Do NOT migrate to Tailwind CSS v4 unless explicitly requested.

Do NOT introduce another styling framework.

Avoid:

- styled-components
- Emotion
- NativeBase styling system
- Tamagui styling
- inline StyleSheet-heavy architecture

NativeWind should be preferred.

---

# 5. DESIGN SYSTEM

LifeOS has a custom design system.

Tailwind configuration contains:

## Colors

life.bg

#09090C

life.surface

#141419

life.border

#2C2C35

life.primary

#6366F1

life.accent

#818CF8

life.text

#FFFFFF

life.muted

#9494A1

life.subtle

#5F5F6B

life.success

#22C55E

life.warning

#F59E0B

life.danger

#EF4444

Do NOT randomly introduce new colors.

If a new color is genuinely required:

1. Check whether an existing LifeOS color can be reused.
2. If not, ask for approval before adding it to the design system.

---

# 6. SPACING

Use the LifeOS spacing scale.

life-1 = 4px
life-2 = 8px
life-3 = 12px
life-4 = 16px
life-5 = 20px
life-6 = 24px
life-8 = 32px
life-10 = 40px
life-12 = 48px
life-16 = 64px

Prefer design-system spacing classes.

Avoid arbitrary spacing unless necessary.

---

# 7. BORDER RADIUS

Use LifeOS radius tokens.

life-sm = 8px
life-md = 12px
life-lg = 16px
life-xl = 20px
life-2xl = 24px

Do not randomly create different radius values.

---

# 8. TYPOGRAPHY

LifeOS typography:

display = 36px / 42px

h1 = 32px / 38px

h2 = 24px / 30px

h3 = 20px / 26px

body-lg = 16px / 24px

body = 15px / 22px

body-sm = 14px / 20px

caption = 12px / 16px

Typography should use the LifeOS typography system.

Use:

LifeText

where appropriate.

Do not create random font sizes throughout the application.

---

# 9. FONT

Primary font:

Inter

Use the LifeOS font configuration.

Do not introduce another font unless explicitly requested.

---

# 10. COMPONENT ARCHITECTURE

Reusable UI components must be created in:

src/shared/components/

Examples:

src/shared/components/Button/

src/shared/components/Input/

src/shared/components/Typography/

Components should be:

- Reusable
- Small
- Focused
- Typed
- Easy to test
- Independent from business logic

Do NOT put business logic inside generic UI components.

---

# 11. CURRENT SHARED COMPONENTS

LifeOS already has:

LifeButton

Location:

src/shared/components/Button/LifeButton.tsx

LifeInput

Location:

src/shared/components/Input/LifeInput.tsx

LifeText

Location:

src/shared/components/Typography/LifeText.tsx

Do NOT recreate these components.

Reuse them.

Only modify them if the existing API cannot reasonably support a requirement.

---

# 12. PROJECT STRUCTURE

Preferred architecture:

src/
├── assets/
│   └── icons/
│
├── shared/
│   └── components/
│
├── features/
│   ├── auth/
│   │   ├── screens/
│   │   └── components/
│   │
│   └── main/
│
├── navigation/
│   ├── RootNavigator/
│   ├── AuthNavigator/
│   └── MainNavigator/
│
├── services/
│
├── hooks/
│
├── store/
│
├── types/
│
└── utils/

Do not create random top-level folders.

Every new file must have a logical architectural location.

---

# 13. FEATURE-BASED ARCHITECTURE

Feature-specific code belongs inside its feature.

Example:

Authentication:

src/features/auth/

Main application:

src/features/main/

Do NOT put feature-specific business logic into:

src/shared/

Shared means genuinely reusable.

---

# 14. STATE MANAGEMENT

LifeOS uses:

Zustand

for global client/application state.

Examples:

- User state
- App preferences
- Theme
- UI state
- Local application state

Do NOT use Redux Toolkit unless explicitly requested.

Do NOT introduce Redux only because a feature requires global state.

First determine whether Zustand is sufficient.

---

# 15. SERVER STATE

LifeOS uses:

TanStack Query

for server/API state.

Use TanStack Query for:

- API data
- Supabase queries
- caching
- loading state
- error state
- refetching
- mutations

Do NOT store server data unnecessarily inside Zustand.

Important rule:

Zustand = client state

TanStack Query = server state

---

# 16. LOCAL COMPONENT STATE

Use React:

useState

for small local component state.

Examples:

- Input value
- Modal visibility
- Password visibility
- Temporary UI state

Do not put every state variable into Zustand.

---

# 17. BACKEND

Backend:

Supabase

Supabase provides:

- Authentication
- PostgreSQL
- Storage
- Realtime

Do NOT introduce Firebase.

Do NOT introduce another backend unless explicitly requested.

---

# 18. SUPABASE

Supabase client:

@supabase/supabase-js

The application must use a centralized Supabase client.

Preferred location:

src/services/supabase.ts

Do NOT create multiple Supabase clients throughout the project.

---

# 19. SUPABASE SECURITY

NEVER expose:

- service_role key
- database password
- private credentials
- secret API keys

in the mobile application.

Only public Supabase credentials intended for client-side use may be included.

Never commit secrets to Git.

Use environment variables / secure configuration.

---

# 20. DATABASE SECURITY

Supabase Row Level Security (RLS) must be enabled for user-owned data.

Every database table containing user-specific data must have appropriate RLS policies.

Never assume that hiding UI is sufficient security.

Security must be enforced at the database/API level.

---

# 21. AUTHENTICATION

Authentication must use:

Supabase Auth

Expected flow:

LoginScreen
↓
Supabase Auth
↓
Authenticated session
↓
RootNavigator
↓
MainNavigator

Unauthenticated user:

AuthNavigator

Authenticated user:

MainNavigator

Do not duplicate authentication logic across screens.

---

# 22. NAVIGATION

Navigation:

React Navigation

Planned architecture:

RootNavigator
├── AuthNavigator
└── MainNavigator

RootNavigator decides whether the user is authenticated.

AuthNavigator contains:

- Login
- Register
- Forgot Password
- Authentication-related screens

MainNavigator contains the authenticated application.

Navigation types must be strongly typed with TypeScript.

---

# 23. TYPESCRIPT RULES

TypeScript must be strict.

Avoid:

any

unless absolutely unavoidable.

Prefer:

unknown

when the type is genuinely unknown.

Create reusable types in:

src/types/

Use explicit types for:

- Navigation
- API responses
- Supabase data
- Zustand state
- Component props
- Forms

Do not ignore TypeScript errors.

---

# 24. COMPONENT PROPS

All reusable components must have typed props.

Example:

type LifeButtonProps = {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
};

Do not use untyped props.

---

# 25. BUSINESS LOGIC

Do not put large business logic directly inside UI components.

Bad:

Screen
├── API calls
├── database logic
├── validation
├── state management
├── navigation
└── UI

Prefer separation:

Screen
↓
Hook / Service
↓
Supabase / API

---

# 26. SERVICES

External communication should be centralized.

Examples:

src/services/supabase.ts

src/services/auth.service.ts

src/services/profile.service.ts

Do not place repeated database queries directly into many screens.

---

# 27. CUSTOM HOOKS

Reusable behavior should use custom hooks.

Location:

src/hooks/

or feature-specific hooks:

src/features/auth/hooks/

Examples:

useAuth()

useProfile()

useDebounce()

Do not create hooks unnecessarily.

---

# 28. FORMS

Forms should have:

- controlled state or appropriate form library
- validation
- loading state
- error handling
- disabled submit state
- clear user feedback

Do not allow invalid data to reach the backend unnecessarily.

---

# 29. ERROR HANDLING

Every asynchronous operation must consider:

- loading
- success
- error

Do NOT silently ignore errors.

Bad:

try {
  await something();
} catch {}

Better:

try {
  await something();
} catch (error) {
  console.error(error);
  // show appropriate user feedback
}

Never expose sensitive backend errors directly to users.

---

# 30. LOADING STATES

Every network operation must have an appropriate loading state.

Buttons should not allow accidental duplicate submissions.

Example:

disabled={loading}

UI should clearly communicate that an operation is in progress.

---

# 31. PERFORMANCE

Performance matters.

Avoid:

- unnecessary re-renders
- unnecessary state
- unnecessary API requests
- huge component trees
- expensive calculations during render
- inline functions everywhere when they cause measurable issues

Use:

useMemo

useCallback

React.memo

ONLY when there is a real performance reason.

Do not blindly memoize everything.

---

# 32. DATA FETCHING

Prefer:

TanStack Query

for remote data.

Avoid:

useEffect(() => {
  fetch(...)
}, [])

for complex server state.

Use caching and proper query invalidation.

---

# 33. API / DATABASE QUERIES

Do not duplicate queries.

If the same query is used in multiple places:

create a reusable service/query hook.

Use predictable query keys.

Example:

['profile']

['tasks']

['habits']

---

# 34. UI DESIGN

LifeOS UI must follow the Figma design.

Figma is the visual source of truth.

Important properties:

- spacing
- typography
- colors
- border radius
- component dimensions
- alignment
- hierarchy
- interaction states

Do not invent a different UI when implementing an existing Figma screen.

---

# 35. FIGMA IMPLEMENTATION

When implementing a Figma screen:

1. Inspect the layout.
2. Identify reusable components.
3. Identify spacing.
4. Identify typography.
5. Identify colors.
6. Identify icons/assets.
7. Implement structure.
8. Compare result with Figma.
9. Fix visual differences.

Do not immediately rewrite the entire screen.

Make targeted changes.

---

# 36. ICONS

Icons belong in:

src/assets/icons/

Example:

src/assets/icons/
├── arrow-left.svg
├── eye.svg
├── wifi.svg
├── signal.svg
└── battery.svg

Use:

react-native-svg

and appropriate SVG transformer configuration.

Do not use random icon libraries unless explicitly approved.

---

# 37. ASSETS

Assets must be organized.

Do not put images/icons randomly inside feature folders unless they are truly feature-specific.

Shared assets:

src/assets/

Feature-specific assets may live inside their feature.

---

# 38. REACT NATIVE RULES

Use React Native primitives appropriately:

View

Text

TextInput

Pressable

TouchableOpacity

ScrollView

FlatList

SectionList

Image

etc.

Prefer:

Pressable

for modern interactive components when appropriate.

Avoid deprecated APIs.

---

# 39. ACCESSIBILITY

Interactive elements should have meaningful accessibility information where appropriate.

Examples:

accessibilityRole

accessibilityLabel

accessibilityState

Do not sacrifice accessibility for visual appearance.

---

# 39.1 VOICE INPUT

LifeOS supports voice-based input for creating tasks and expenses.

Voice-to-text library:

@react-native-voice/voice

Do NOT introduce another speech-to-text library unless explicitly requested.

## Location

Voice input hook:

src/features/main/hooks/useVoiceInput.ts

Voice parsing service (raw transcript → structured task/expense data):

src/services/voiceParser.service.ts

## Flow

User presses mic button
↓
useVoiceInput starts listening (@react-native-voice/voice)
↓
Raw transcript received
↓
voiceParser.service.ts extracts structured data
(e.g. date, time, category, amount, title)
↓
Structured result passed to the relevant form/state
↓
User confirms before saving to Supabase

Do NOT save voice-parsed data directly to the database without
allowing user confirmation/edit first.

## Parsing

Voice parsing logic must live in a service, not inside UI components
or inside the hook itself.

If parsing requires an LLM/API call, centralize it in
src/services/voiceParser.service.ts and use TanStack Query
(mutation) to call it — do not call it directly from screens.

## Error Handling

Voice input must handle:

- microphone permission denied
- no speech detected
- recognition error
- unsupported device/locale

Never silently fail. Show clear user feedback in each case.

---

# 39.2 PERMISSIONS

LifeOS requires runtime permissions for voice input (and potentially
notifications, see 39.4).

## iOS

Add usage descriptions to Info.plist:

NSMicrophoneUsageDescription
NSSpeechRecognitionUsageDescription

## Android

Add to AndroidManifest.xml:

RECORD_AUDIO

## Runtime Requests

Permission requests must happen at the point of use (e.g. when the
user taps the mic button), not on app launch.

Use a centralized permissions utility:

src/utils/permissions.ts

Do not duplicate permission-request logic across screens.

If a permission is denied, show a clear explanation and a path to
enable it in system settings — do not silently disable the feature.

---

# 39.3 OFFLINE / LOCAL-FIRST STATE

LifeOS is a daily-use productivity app and must remain usable with
poor or no connectivity.

## Strategy

- Zustand state that must survive app restarts uses persist
  middleware with AsyncStorage.
- TanStack Query is configured with a persisted cache
  (e.g. via @tanstack/query-async-storage-persister) so previously
  loaded tasks/expenses remain visible offline.
- Mutations created while offline (new task, new expense, voice
  entry) must be queued and retried when connectivity returns —
  do not silently drop them.

## What Belongs Where

Cached server data (tasks, expenses fetched from Supabase):
TanStack Query persisted cache.

Pending/unsynced local entries (created offline, not yet confirmed
saved to Supabase):
Zustand, with a clear "pending sync" status field.

Do NOT treat unsynced local entries as if they were confirmed
server data.

## Sync Indicator

The UI should indicate when data is stale/offline or when entries
are pending sync, using the LifeOS design tokens
(e.g. life.warning for "pending sync").

---

# 39.4 NOTIFICATIONS

LifeOS uses local notifications for task/plan reminders.

Library:

@notifee/react-native

Do NOT introduce a different notification library unless explicitly
requested.

## Location

src/services/notification.service.ts

## Rules

- Schedule a local notification when a task/plan with a due time is
  created or edited.
- Cancel/reschedule the notification when the task is edited or
  deleted.
- Do NOT schedule duplicate notifications for the same task.
- Notification permission must be requested at the point the user
  first creates a task with a reminder, following the same pattern
  as 39.2 (Permissions).
- Notification scheduling logic must live in the service, not
  inside screens or components.

---

# 40. RESPONSIVE DESIGN

Do not hardcode an entire screen around one device size.

Use flexible layouts:

flex

flex-1

percentage dimensions where appropriate

safe areas

responsive spacing

Use absolute positioning only when justified by the design.

---

# 41. SAFE AREAS

Screens must account for:

- status bar
- notch
- home indicator
- different device sizes

Do not assume every device has identical dimensions.

---

# 42. DARK / LIGHT THEME

LifeOS currently has a dark visual system.

Do not introduce light mode UI unless explicitly requested.

The LifeOS dark design system is the current source of truth.

---

# 43. CODE QUALITY

Code must be:

- readable
- predictable
- maintainable
- typed
- modular
- reusable

Avoid clever code when simple code is clearer.

Bad:

const x = a?.b?.c ?? fn?.();

when the logic is unclear.

Prefer readable code.

---

# 44. NAMING

Components:

PascalCase

Example:

LifeButton.tsx

LifeInput.tsx

LoginScreen.tsx

Functions:

camelCase

Example:

handleLogin()

fetchProfile()

Variables:

camelCase

Constants:

UPPER_SNAKE_CASE only when appropriate.

---

# 45. FILE NAMES

React components:

PascalCase.tsx

Hooks:

useSomething.ts

Services:

something.service.ts

Types:

something.types.ts

Utilities:

something.ts

Keep naming predictable.

---

# 46. COMMENTS

Do not write unnecessary comments.

Bad:

// This is a button
<Button />

Comments should explain:

WHY

not:

WHAT

Example:

// Prevent duplicate requests while authentication is in progress.

---

# 47. NO DUPLICATION

Do not copy/paste the same logic across files.

If logic is genuinely reusable:

extract it.

But do not create abstractions prematurely.

Rule:

First make it correct.

Then make it reusable when repetition appears.

---

# 48. DEPENDENCIES

Before adding a package:

1. Check whether the project already has a solution.
2. Check whether React Native itself provides the functionality.
3. Check whether an existing dependency can solve it.
4. Only then consider adding a dependency.

Do NOT add packages casually.

Every new dependency must have a clear reason.

---

# 49. PACKAGE INSTALLATION

Use Yarn.

Example:

yarn add @supabase/supabase-js

Development dependency:

yarn add -D package-name

Never modify package.json manually when a package manager command is more appropriate.

---

# 50. ENVIRONMENT VARIABLES

Never hardcode secrets.

Use environment configuration.

Examples:

SUPABASE_URL

SUPABASE_ANON_KEY

Never commit:

.env

with secrets.

If environment handling differs between React Native CLI and web tooling, follow the project's established configuration rather than copying Vite-specific examples.

---

# 51. GIT

Use meaningful commits.

Examples:

feat: add Supabase authentication

fix: resolve login validation

refactor: extract auth service

style: adjust login spacing

chore: configure NativeWind

Do not make meaningless commits:

update

changes

test

asdf

---

# 52. GIT SAFETY

Never run destructive Git commands without explicit approval.

Do NOT automatically run:

git reset --hard

git clean -fd

git checkout -- .

or similar destructive commands.

Never delete user work to fix an issue.

---

# 53. FILE SAFETY

Before modifying a file:

- inspect the existing code
- understand its purpose
- preserve working behavior

Never overwrite a complete file if only a small section needs changing.

Prefer targeted edits.

---

# 54. DEBUGGING

When an error occurs:

1. Read the complete error.
2. Identify the root cause.
3. Inspect relevant configuration.
4. Make the smallest necessary fix.
5. Verify the fix.
6. Do not randomly change multiple files.

Never use trial-and-error configuration changes without understanding the problem.

---

# 55. VERIFICATION

After every meaningful code change:

Check:

- TypeScript errors
- imports
- lint errors
- build errors
- runtime issues
- navigation issues
- styling issues

If possible, run the relevant command.

Example:

yarn tsc --noEmit

or the project's configured typecheck command.

---

# 56. BUILD QUALITY

Code is NOT considered finished simply because it looks correct.

A feature is complete only when:

- UI works
- logic works
- errors are handled
- loading is handled
- types are correct
- navigation works
- backend integration works when applicable
- no obvious regressions exist

---

# 57. AI AGENT BEHAVIOR

The AI agent must NOT:

- invent requirements
- invent API responses
- invent database columns
- invent Figma specifications
- invent package versions
- rewrite the architecture
- introduce unnecessary libraries
- delete existing functionality
- expose secrets
- ignore TypeScript errors
- silently change configuration

---

# 58. WHEN REQUIREMENTS ARE UNCLEAR

If the requirement is unclear but a safe interpretation exists:

make the smallest reasonable implementation.

If the ambiguity affects:

- architecture
- database schema
- security
- authentication
- navigation
- package selection
- major UI behavior

STOP and ask for clarification.

Do not make a major architectural decision silently.

---

# 59. AI CODE GENERATION STANDARD

Generated code must be production-quality.

The agent must prioritize:

1. Correctness
2. Security
3. Type safety
4. Maintainability
5. Performance
6. Reusability
7. Simplicity

Do not optimize for shortest code.

Optimize for high-quality engineering.

---

# 60. EXISTING CODE FIRST

Before creating a new component, hook, service, utility, or type:

SEARCH THE PROJECT.

Determine whether something already exists.

Reuse existing code when appropriate.

Never create:

LifeButton2

LifeInputNew

AuthServiceNew

UserServiceFinal

etc.

---

# 61. DATABASE RULES

Database schema must be intentional.

Before creating a table, determine:

- primary key
- foreign keys
- nullable fields
- default values
- indexes
- timestamps
- RLS
- constraints

Use database constraints whenever possible.

Do not rely only on frontend validation.

---

# 62. USER DATA

User-specific records should normally reference the authenticated user.

Use appropriate foreign keys.

Do not trust a client-provided user ID without authorization checks.

RLS must enforce ownership.

---

# 63. AUTH SESSION

Authentication state should be centralized.

Do not manually duplicate login state across screens.

Supabase session should be the source of truth for authentication.

Zustand may mirror derived application state where useful, but should not become a competing authentication source.

---

# 64. SECRETS

NEVER request the user to send:

- passwords
- Supabase database password
- private keys
- service role keys
- API secrets

If debugging requires credentials, instruct the user where to configure them without asking them to paste secrets into chat.

---

# 65. PORTFOLIO QUALITY

LifeOS is a portfolio project.

Therefore implementation should demonstrate professional engineering practices:

- clean architecture
- TypeScript
- reusable components
- proper state management
- server-state management
- authentication
- database security
- error handling
- loading states
- responsive UI
- performance awareness
- maintainable code

Avoid toy-project architecture.

---

# 66. CURRENT ARCHITECTURE

Current intended stack:

React Native CLI
+
TypeScript
+
NativeWind
+
Tailwind CSS 3.4.x
+
React Navigation
+
React Native SVG
+
Zustand
+
TanStack Query
+
Supabase
+
Yarn

Architecture:

UI
↓
Feature components/screens
↓
Hooks
↓
Services
↓
Supabase

Client state:

Zustand

Server state:

TanStack Query

Authentication:

Supabase Auth

Database:

Supabase PostgreSQL

Storage:

Supabase Storage

Realtime:

Supabase Realtime

---

# 67. DEVELOPMENT ORDER

When implementing LifeOS features, prefer this order:

1. Define requirement
2. Check architecture
3. Check existing components
4. Define types
5. Implement service/data layer
6. Implement state/query logic
7. Implement UI
8. Connect UI to logic
9. Add loading/error states
10. Verify
11. Refactor only if necessary

Do not start by writing random UI logic.

---

# 68. SCREEN IMPLEMENTATION

Recommended screen structure:

Screen
├── Header
├── Main
│   ├── Content
│   ├── Form
│   └── Actions
└── Footer

Keep screen-level layout separate from reusable components.

---

# 69. CURRENT LOGIN SCREEN

Login screen:

src/features/auth/screens/LoginScreen.tsx

The login UI should follow the LifeOS Figma design.

Existing reusable components:

LifeText

LifeInput

LifeButton

Do not replace them with duplicated Text/TextInput/Button implementations without a strong reason.

---

# 70. Figma → React Native

When converting Figma:

Do NOT blindly copy every pixel as absolute positioning.

Instead:

- understand layout hierarchy
- use flexbox
- use design tokens
- preserve spacing relationships
- use reusable components

The final result should visually match the design while remaining maintainable.

---

# 71. RESPONSE STYLE

When the user asks for implementation help:

Be concise and practical.

Prefer:

1. What we are doing
2. Exact file path
3. Exact code change
4. Command if necessary
5. How to verify

Do not provide unnecessary theory unless requested.

---

# 72. STEP-BY-STEP WORKFLOW

For larger tasks:

DO NOT implement everything at once.

Break the task into logical steps.

Example:

Step 1
Install dependency

Step 2
Create service

Step 3
Configure environment

Step 4
Create types

Step 5
Connect authentication

Step 6
Test

Wait for verification when the task involves a risky configuration change.

---

# 73. FINAL RULE

Quality over speed.

Never sacrifice:

- security
- architecture
- maintainability
- type safety
- correctness

just to finish a task faster.

LifeOS must remain a clean, professional, production-quality React Native application.

END OF RULES.
