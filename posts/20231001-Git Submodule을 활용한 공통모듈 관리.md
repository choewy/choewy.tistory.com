# 들어가며

커리어를 백엔드 개발자로 바꾼지 어느덧 1년이 훌쩍 지났다. 작은 스타트업에서 근무하는 동안 다양한 이슈들이 많았고, 개선하고 싶은 것들도 무수히 많이 쌓여간 반면, 바쁘다는 핑계로 블로그 글은 제대로 작성하지 못했다.

> 연속되는 신규 기능 업데이트, 전혀 반갑지 않은 버그 픽스, 개발 외 다른 업무 처리 등으로 정말 바쁘긴 빴다...

현재 내가 근무하는 곳은 명확한 업무 프로세스 또는 체계가 없고, 개발적으로만 보더라도 개선하고 싶은 점들이 정말 많다. 혹자는 이런점들이 스타트업의 단점이라고 하고 나 또한 그리 생각하나, 전화위복이라 하지 않았는가? 제대로 된 실적과 실력만 증명한다면 내가 그리던 시스템을 이곳에 적용시켜보고, 그 과정에서 스스로 성장하기 위한 매우 좋은 밑거름이 될 수 있다고 생각한다.

> 멀리서 보면 희극, 가까이서 보면 비극이라는 말이 있지 않은가? 실제로 비극이 더 많은 것이 착잡하긴 하지만, 밤낮, 평일 주말 상관없이 어떻게 하면 더 나은 시스템을 구축할 수 있을까를 고민하는 과정에서 공부할 거리가 많이 생긴다는 것이 때론 좋기도 하다.

아무튼, 오늘은 submodule을 통해 공통모듈을 관리하는 방법에 대해서 작성해보겠다.

# 1. 배경

내가 개발하는 서비스의 백엔드는 크게 3가지 서버(메인, 서브, 관리자)로 나뉘어 있다. 모두 NestJS를 사용하여 개발되었고, TypeORM을 사용하고 있다. 서비스의 기능적 규모가 커지고, 복잡도가 높아짐에 따라 데이터베이스의 테이블 수 또한 약 30개 정도로 구성되어 있다.

> 기존 레거시 버전의 서비스에 리팩토링이나, 제대로 된 설계 없이 최대한 빠른 시일 내에 신기능만 겹겹이 쌓아 올리다보니 데이터베이스 구조나 코드 또한 개선해야 할 점들이 매우 많다. 예를 들자면, TypeORM의 Migration 기능을 전혀 사용하지 않고, 코드 상의 관계 설정과 실제로 데이터베이스의 관계 설정이 불일치한다는 치명적인 문제가 있다. 그러다보니, TypeORM의 Migration을 사용할 수도 없을 뿐더러, Join 쿼리 사용 시 성능적 이슈가 발생할 수 밖에 없다.

30개의 테이블 중에서 약 20개 정도는 3개 서버에 모두 사용된다. 즉, 3개 서버 코드에 각각 30개의 Entity가 존재하며, DB 테이블이 변경되면 3개의 Entity 코드를 모두 수정해주어야 한다. 이러한 작업을 할 때면, 머릿속에서 또 다른 자아가 매우 비효율적이라는 불만을 토로하고 있었다. 이와 같은 문제점을 어떻게하면 개선할 수 있을까를 시간일 날 때마다 고민해왔고, 비교적 한가하진 이 시기에 이 문제를 해결해보고자 하였다.

## 1.1. Npm 모듈 배포

처음에는 npm 모듈로 배포하는 방법을 생각해보았다. npm에 테이블 구조를 나타내는 Entity의 집합을 모듈로 배포하면, 회사에서 운영하는 서비스의 데이터 구조를 고스란히 노출시키게 되므로 private로 배포해야한다. 그리고 여러 작업자가 함께 배포해야 하므로 유료 멤버십 결제를 해야한다. 때문에 잠시 보류하고, 다른 방법을 찾아보았다.

> 여러 작업자라고 하지만, 최근에 백엔드 개발자 1명이 합류했다. 동료가 생긴 것이다. 거의 8개월 동안 혼자서 신기능 개발, 버그 픽스, 데이터 추출 등 여러 일을 쫒기듯 해오다보니 많이 지쳐있었다. 서비스 구조 파악 등의 이유로 새로 합류한 동료가 지금 당장은 실무에 투입되하는 못하겠지만, 머지않아 매우 좋은 동료로 함께 일할 수 있을 거라는 생각이 든다.

## 1.2. NestJS Mono Repository

NestJS에서는 mono repository 구조를 제공한다. 실제로 국내 서비스를 오마주하여 해외 서비스를 런칭할 때에는 mono repo로 개발하였다. 실 개발 기간은 약 1.5개월 정도였는데, 그때는 생각지 못했으나, 지금와서 다시 개발하라고 하면 아래의 이유로 mono repo 구성이 옳지 않은 판단이었다고 생각이 든다.

- 하나의 프로젝트 코드로 관리하므로 여럿이 작업할 때 다소 잦은 충돌이 발생할 수 있을 것 같다.
- 앞서 언급했듯이, 3개의 서버 애픜리케이션 코드가 하나의 프로젝트로 구성되어 있으므로, CI/CD 파이프라인을 구성할 때 되려 손이 많이 갔다(현재 Bitbucket 사용중)
- 결론적으로, 프로젝트 규모가 크지 않을 때에는 mono repository가 괜찮을 수 있으나, mono repository안에 application 수가 5개, library 수가 20개 정도 되면 코드를 찾는 것, 관리하는 것이 매우 불편하게 느껴졌다.

## 1.3. Git Submodule

예전에 git submodule을 통해 python 프로젝트를 관리했던 경험이 떠올랐다.

> 왜 이제서야 이 방법이 떠오른 것인지... 그때는 submodule을 아무 생각도 없이 사용했던 것 같다. 왜냐고? 그렇게 되어 있었으니깐.

이 기억을 떠올린 후 주말에 카페에가서 곧장 실행으로 옮겼다.

# 2. 실습

혼자서 구조를 잡아본 것이므로 회사 계정의 BitBucket이 아닌 GitHub으로 새로운 Repository를 생성했다.

- [nestjs-structure](https://github.com/choewy/nestjs-structure)
- [nestjs-submodule](https://github.com/choewy/nestjs-submodule)

nestjs-structure는 임시로 만든 서버 애플리케이션이고, nestjs-submodule은 TypeORM Entity가 담긴 서브모듈이다. 애플리케이션의 폴더 구조는 NestJS CLI로 생성한 프로젝트의 폴더 구조에 submodule 폴더만 프로젝트 최상위에 위치한다.

> submodule 폴더는 git 명령어로 생성할 것이므로 직접 생성하지 않아도 된다.

## 2.1. TS Config JSON 설정

서브모듈은 NestJS 프레임워크가 아닌 NodeJS에 필요한 NestJS 라이브러리와 Typeorm 정도만 설치했다. 그리고 tsconfig.json에 alias path를 설정해주었는데, 이는 NestJS 애플리케이션에서도 동일하게 적용해주어야 한다.

> alias 설정은 optional이다. 필자는 개인적으로 상대 경로의 depth가 2를 넘어가면 가독성이 떨어진다고 생각하여 alias를 설정하였다.

- nestjs-submodule의 tsconfig.json

```json
{
  "compilerOptions": {
    "paths": {
      "@submodule": ["src"],
      "@submodule/*": ["src/*"]
    }
  }
}
```

- nestjs-structure의 tsconfig.json

```json
{
  "compilerOptions": {
    "paths": {
      "@submodule/*": ["submodule/src/*"],
      "@app/*": ["src/*"]
    }
  }
}
```

tsconfig.json 파일을 설정했다면 submodule 코드에 아무 함수를 작성 후 master 브랜치에 push 해보자.

```ts
/** @path nestjs-submodule/src/helpers.ts */

export const helloSubmodule = () => 'hello, submodule.';
```

## 2.2. Submodule Clone

이제 애플리케이션(nestjs-structure)에서 submodule을 불러와야 한다.

```zsh
git submodule add $SUBMODULE_BRANCH $DIR_PATH
```

- SUBMODULE_BRANCH : 서브모듈로 연결할 GitHub 또는 BitBucket Repository 링크
- (선택사항) DIR_PATH : 서브모듈이 담길 폴더 이름(clone이랑 같다)

## 2.3. Nest CLI JSON 설정

애플리케이션(nestjs-structure)의 nest-cli.json을 아래와 같이 수정해주었다.

> 서브 모듈의 main.ts는 synchronize를 실행하기 위한 코드이므로, 실제로 빌드될 때에는 제외하도록 exclude에 포함시켰다.

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true,
    "webpack": true,
    "assets": [
      {
        "include": "submodule/src/**/*",
        "exclude": "submodule/src/main.ts",
        "outDir": "dist/submodule",
        "watchAssets": true
      }
    ]
  }
}
```

정상적으로 빌드가 되는지 테스트해보기 위해 nestjs-structure/src/main.ts에서 submodule에 작성한 함수를 불러와서 호출하도록 수정 후 실행해보자.

```ts
/** @path nestjs-structure/src/main.ts */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import { helloSubmodule } from '@submodule/helpers';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000, () => {
    console.log(helloSubmodule());
  });
}

bootstrap();
```

## 2.4. Package JSON 실행 스크립트 수정

이 또한 선택사항이지만, 개발 시 submodule을 최신 상태로 불러오도록 하기 위해 아래 스크립트를 추가 및 수정하였다.

```json
{
  "scripts": {
    "submodule:pull": "git submodule foreach git pull origin master",
    "start:dev": "npm run submodule:pull && nest start --watch"
  }
}
```

이제 `npm run start:dev`로 서버 애플리케이션을 실행할 때 submodule을 먼저 업데이트 하고 서버 애플리케이션이 실행된다. 만약, submodule에 수정사항이 있다면 경우에 따라서는 서버 애플리케이션에 오류가 발생할 것이고, 해당 부분들만 수정해주면 된다.

# 마치며

submodule을 사용하고자 할 때에는 설계에 더욱 신경써야 할 것 같다는 생각이 들었다. 구조에 따라 submodule은 비효율을 해결해주는 처방이 될 수도 있지만, 프로젝트 구조를 엉망으로 만드는 주축이 될 수도 있기 때문이다.

> 특히나 프로그래밍는 정답이 없는 경우가 많기 때문에, 환경에 따라서 알맞게 설계하는 것이 매우 중요하다고 생각한다.

지금은 TypeORM의 Entity만을 submodule로 관리했지만, 여러 프로젝트에서 공통으로 사용하는 모듈을 submodule로 관리하는 것도 꽤 괜찮은 방법이 될 수 있을 것 같다.
