# 들어가며

필자는 NestJS에 TypeORM을 주로 사용하고 있다. TypeORM에서 Entity를 생성할 때 Colume 속성을 지정할 수 있다. Colume 속성을 정수형으로 하는 경우에 값의 범위에 따라 tinyint, smallint, mediumint, int, bigint를 지정할 수 있다. 이중에서 bigint로 지정하는 경우, 해당 property의 타입을 number로 지정하였음에도 불구하고 실제 값은 string으로 매핑되어 javascript의 `===` 연산이 항상 false로 된다. 오늘은 이와 같이 TypeORM에서 bigint를 사용할 때 주의해야 할 점에 대해서 정리해보겠다.

# 1. 개요

## 1.1. MySQL 정수 표현 속성

MySQL에서 정수를 표현하는 속성은 다음과 같이 5가지가 있다.

- tinyint(1 bytes)

  - signed : -128 ~ 127
  - unsigned : 0 ~ 255

- smallint(2 bytes)

  - signed : –32,768 ~ 32,767
  - unsigned : 0 ~ 65,535

- mediumint(3 bytes)

  - signed : -8,388,608 ~ 8,388,607
  - unsigned : 0 ~ 16,777,215

- int(4 bytes)

  - signed : –2,147,483,648 ~ 2,147,483,647
  - unsiged : 0 ~ 4,294,967,295

- bigint(8 bytes)
  - signed : –9,223,372,036,854,775,808 ~ 9,223,372,036,854,775,807
  - unsigned : 0 ~ 18,446,744,073,709,551,615

## 1.2. int vs bigint

DB를 설계할 때, int 값의 범위가 bigint 값의 범위보다 작기 때문에 id 값이 42억을 넘어가지 않는다면 int unsigned로, 42억을 넘어가면 bigint unsigned로 사용해야 한다. int의 범위가 bigint의 범위보다 좁으면 bigint로 하는 편이 낫지 않은가라는 의문이 생길 수 있으나, MySQL의 메모리 용량 및 서버 저장 공간, 쿼리 속도를 고려하면 오히려 int가 효율적이라고 할 수 있다. int는 bigint에 비해 10% 이상의 디스크 용량을 절약한다고 하며, 수십억개의 데이터를 가지지 않는다면 속도 등의 효율성을 따져보았을 때 bigint 대신 int로 사용할 것을 권장하고 있다.

그도 그럴 것이 bigint가 차지하는 공간은 8bytes, int가 차지하는 공간은 그에 절반인 4bytes이기 때문이다. 즉, 데이터가 43억개 미만의 중규모의 DB는 int가 서버 운영 측면에서 훨씬 효율적일 수 있다는 것이다. 그런데 어찌보면 쿼리 성능은 쿼리를 어떻게 작성하는냐에 따라 상이할 것이고, index로 조회하는 경우에는 크게 체감하지 못할 것 같긴 하다. 그래서 혹자는 bigint와 int 쿼리 속도를 고려할 시간에 쿼리 튜닝을 먼저하고, 최후의 수단으로 int로 지정하라는 의견도 있다.

## 1.3. 개인적 견해

조금 다른 화제이나, 실제로 2019년 7월 경에 쿠팡에서 Redis의 키가 21억개를 넘어서면서 시스템 장애가 발생한 적이 있다. 반나절 정도 서비스가 중단되었고, 손해도 꽤나 큰 것으로 알고있다. 마찬가지로 int로 지정한 데이터의 수가 42억개(unsigned인 경우)를 넘어선다면 이와 비슷한 오류가 발생할 것이고, 이와 같은 오류로 서비스에 막대한 손해를 불러일으킬 바에는 쿼리 성능 상 별 차이가 나지 않는다면 bigint로 지정하는 편이 오히려 마음 편할 수도 있겠다는 생각이 들었다. 반면, 서비스를 오래 지속할 것이 아니거나, 서비스의 운영 기간에 따른 데이터 수의 상승폭이 크지 않다면 굳이 성능을 악화시킬 필요는 없으니 int unsigned로 사용해도 무방할 것으로 보인다.

- 서비스를 장기간 운영할 것인가? or 서비스를 운영하는 기간과 데이터의 양이 비례할 것으로 예상하는가? : bigint
- 서비스를 단기간 운영할 것인가? or 서비스를 운영하는 기간과는 무관하게 데이터의 양이 크게 증가하지 않을 것으로 예상하는가? : int

# 2. 실습

본 글에서는 아래와 같은 조건으로 반드시 bigint를 사용한다는 가정 하에 실습을 진행하겠다.

- 서비스를 장기간 운영할 것이다.
- 서비스 운영 기간이 늘어남에 따라 데이터의 양 또한 증가할 것으로 예상한다.
- 값의 범위가 43억을 넘는 값을 저장해야 한다.

## 2.1. bigint인 colume 값 출력 결과

먼저, 아래와 같은 Entity를 간단히 작성해보자.

```ts
@Entity({ name: User.name })
export class User extends Relations {
  @PrimaryGeneratedColumn({
    type: 'bigint',
    unsigned: true,
  })
  readonly id: number;

  @Column({
    type: 'varchar',
    length: 30,
  })
  nickname: string;

  @CreateDateColumn()
  readonly createdAt: Date;

  @UpdateDateColumn()
  readonly updatedAt: Date;

  @DeleteDateColumn()
  readonly deletedAt: Date | null;
}
```

그리고 아래와 같은 코드를 작성하여 synchronize의 힘을 빌려 테이블을 만들고, User 테이블에 데이터를 입력한 후 출력해보자.

```ts
const main = async () => {
  const dataSource = new DataSource({
    type: 'mysql',
    host: 'localhost',
    port: 3306,
    userame: 'root',
    password: 'root_password',
    database: 'test',
    synchronize: true,
    autoLoadEntities: true,
    entities: [User],
  });

  await dataSource.initialize();

  const userRepository = dataSource.getRepository(User);
  const user = userRepository.create({ nickname: 'choewy' });
  await userRepository.save(user);

  console.log(user.id);
};

main();
```

그 결과 user의 id는 `1`이 아닌 `'1'`로 출력되는 것을 알 수 있다. 이와 같은 이유는 Javascript의 Number 타입으로는 bigint의 모든 값을 제대로 나타낼 수 없기 때문이다. 실제로 아래와 같이 bigint unsigned 범위의 최대값을 출력하는 코드를 실행해보면 다음과 같은 결과를 확인할 수 있다.

```js
>> console.log(18446744073709551615);
>> 18446744073709552000
```

[MDN 문서에 따르면](https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Global_Objects/Number) Number로 표현 가능한 값의 범위는 다음과 같고 기재되어 있다.

```js
const biggestInt = Number.MAX_SAFE_INTEGER; //  (2**53 - 1) =>  9007199254740991
const smallestInt = Number.MIN_SAFE_INTEGER; // -(2**53 - 1) => -9007199254740991
```

## 2.2. Javascript의 BigInt

[MDN 문서에 따르면](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt) primitive로 표현하기에 너무 큰 값은 BigInt라는 객체를 사용하도록 안내되어 있다. BigInt 객체의 Prototype은 Object이며, 값을 출력하면 뒤에 n이 붙는다.

```js
typeof 1n === 'bigint'; // true;
typeof BigInt('1') === 'bigint'; // true;
typeof Object('1n') === 'object'; // true;
1n === 1; // false
1n == 1; // true
```

MDN 문서에 자세히 기재되어 있으나, 이 중에서 주로 실수할 것 같은 BigInt를 다룰 때 주의할 점으로는 다음과 같다.

- BigInt를 Number로 강제 변환할 수 있으나, 이 경우 정밀도가 손실될 수 있다.
- BigInt는 일부 연산자(관계, 항등, 논리)를 제외한 산술 연산자, 비트 연산자, 단항 부정 연산자, 증감연산자를 사용할 때에는 피연산자도 BigInt일 때에만 사용할 수 있다.

# 마치며

PK로 bigint를 사용하는 경우에는 해당 값의 속성을 string으로 지정하는 편이 훨씬 마음 편할것 같다. 만약, PK가 아니라 값으로 bigint를 사용할 때에는 MDN 문서를 꼼꼼히 읽어보고 사용하는 편이 실수를 방지하는데 많은 도움이 되지 않을까 싶다.
