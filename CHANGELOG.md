# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [3.4.0](https://gitlab.mitre.org/BB-ATE/rey/compare/v3.3.2...v3.4.0) (2023-08-22)


### Features

* add Activity Set group matching panel ([0c2c26b](https://gitlab.mitre.org/BB-ATE/rey/commit/0c2c26ba755cf0b78c7bc5eeff5446eda3aeec31))


### Bug Fixes

* account for device pixel ratio when rendering graphics ([cbf0d50](https://gitlab.mitre.org/BB-ATE/rey/commit/cbf0d50b686c7cb7aa34c7f0a36bd15b12fd3843))
* fix bug that prevents Activity Sets with root cycles from rendering ([15b6246](https://gitlab.mitre.org/BB-ATE/rey/commit/15b624601bcb72b1755307372acbf5bfc4749d5c))
* fix import bug that mixed up tactic and technique ([05d94fe](https://gitlab.mitre.org/BB-ATE/rey/commit/05d94fe9fff9eafd49b74121b365f2cffbde76d2))
* stop drag events from selecting text in Safari ([d03b537](https://gitlab.mitre.org/BB-ATE/rey/commit/d03b537c60f8b3b2f2875dbaf256b290eef56d53))

### [3.3.2](https://gitlab.mitre.org/BB-ATE/rey/compare/v3.3.1...v3.3.2) (2022-06-30)


### Bug Fixes

* make file import score Activity Sets with an ActivitySetClassification, not an integer ([2d78b7c](https://gitlab.mitre.org/BB-ATE/rey/commit/2d78b7c3fcb78221895700cbe7d95677063ccadd))

### [3.3.1](https://gitlab.mitre.org/BB-ATE/rey/compare/v3.3.0...v3.3.1) (2022-04-29)


### Bug Fixes

* add missing field to archive file inject widget ([174deaa](https://gitlab.mitre.org/BB-ATE/rey/commit/174deaae969cca81d5567e963a436e72833007d5))
* correct Activity Set Information panel's primary text color ([698244c](https://gitlab.mitre.org/BB-ATE/rey/commit/698244c9f0d95b6965ee1aed586e0ecd70e2d319))
* truncate file_path from its start (instead of its end) ([dc56689](https://gitlab.mitre.org/BB-ATE/rey/commit/dc566896918940ce8682c28104922f727e84c03a))

## [3.3.0](https://gitlab.mitre.org/BB-ATE/rey/compare/v3.2.0...v3.3.0) (2022-04-28)


### Features

* add archive content widget to details panel ([bc1d376](https://gitlab.mitre.org/BB-ATE/rey/commit/bc1d376ea0f666a9f36ca14524ca81527aac4dc1))
* add product attribution display setting ([3acd166](https://gitlab.mitre.org/BB-ATE/rey/commit/3acd1669723e9e2c253ecc7f232a33df75a05fa1))


### Bug Fixes

* prioritize nested ScrollBox over parent ScrollBox during scrollwheel ([d1f020f](https://gitlab.mitre.org/BB-ATE/rey/commit/d1f020f314c6483f3f32d1b2d06e4225d756ac9d))

## [3.2.0](https://gitlab.mitre.org/BB-ATE/rey/compare/v3.1.0...v3.2.0) (2022-04-14)


### Features

* add Activity Set Information panel ([a28203b](https://gitlab.mitre.org/BB-ATE/rey/commit/a28203b228806c1175bb3dcd9e12cabf903b15d4))
* add improved selection system ([45aa59a](https://gitlab.mitre.org/BB-ATE/rey/commit/45aa59a7c6ce384f95b2d62a11b827217b5f0d6b))


### Bug Fixes

* make selection tabs resolve activity set ids from nodes only ([3b09d7c](https://gitlab.mitre.org/BB-ATE/rey/commit/3b09d7c0c81a20e8cdf6aecae76658030c2ef6d1))

## [3.1.0](https://gitlab.mitre.org/BB-ATE/rey/compare/v3.0.0...v3.1.0) (2022-03-24)


### Features

* add Jump to Node window ([3de060e](https://gitlab.mitre.org/BB-ATE/rey/commit/3de060ecd6ad550c51654c836007aad7b4d54a56))


### Bug Fixes

* add 'no items' fallback to import window's filters and results ([076b6d5](https://gitlab.mitre.org/BB-ATE/rey/commit/076b6d521533c1025424a633dffcb16af5a7daf9))
* disable text selection on date picker control ([31f596c](https://gitlab.mitre.org/BB-ATE/rey/commit/31f596c2fc9fdc05afa54ec7a4c204f2ed17fe87))
* disable text selection on import window's section titles ([c7375fa](https://gitlab.mitre.org/BB-ATE/rey/commit/c7375fab9913633c4716e6888d106a9f4b48d689))
* make import window's id field automatically focus when window opens ([21d1714](https://gitlab.mitre.org/BB-ATE/rey/commit/21d171403d9b09f562fee2c77c5474aa37125bfd))
* make import window's id field submit when enter key pressed ([ef13e42](https://gitlab.mitre.org/BB-ATE/rey/commit/ef13e42bec607c674ffae3d8926c3b3b92cdbe9c))
* rename Release Notes to Change Log ([58b0716](https://gitlab.mitre.org/BB-ATE/rey/commit/58b07160c2192df79507c62b6b6fea70ad411c34))
* switch activity set score display to binary classes ([e00b5fb](https://gitlab.mitre.org/BB-ATE/rey/commit/e00b5fbd374fd20dd41fa2b8a645d70897bfc129))

## 3.0.0 (2022-03-23)


### ⚠ BREAKING CHANGES

* major UI and performance improvements

### Features

* initial commit of Rey v3.0.0 ([db61b98](https://gitlab.mitre.org/BB-ATE/rey/commit/db61b98f6dd6c88435dedbdabd0c704686fe3be1))
