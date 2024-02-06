# 들어가며

요즘 백엔드 개발자의 필수 역량이자 꽃이라 불리우는 대용량 트래픽 처리에 관련한 공부를 하고 있다. 그 중 데이터베이스 인덱스에 관련한 내용을 공부하였고 직접 테스트해보며 정리한 내용을 작성하였다.

# 1. 인덱스란?

인덱스는 탐색 범위를 최소화할 수 있는 정렬된 자료구조이다. 먼저, 아래 주어진 숫자들 중에서 8을 찾아보자.

```json
[2, 5, 3, 1, 4, 7, 6]
```

```json
[1, 2, 3, 4, 5, 6, 7]
```

사실 위의 두 배열 중에서 8은 없다. 위의 두 배열 중에서 어느 배열이 8이 없다는 사실을 알기까지 더 짧은 시간이 걸리던가?

조금 더 자세한 예시를 살펴보자. 아래 학생들 중에서 수학 점수가 가장 낮은 학생의 이름를 찾아보자(현재 ID에만 인덱스가 적용되어 있다).

| ID  | 이름 | 국어 | 수학 | 영어 |
| :-: | :--: | :--: | :--: | :--: |
|  1  |  A   |  55  |  70  |  60  |
|  2  |  B   |  80  |  85  |  20  |
|  3  |  C   |  40  |  55  |  50  |
|  4  |  D   |  90  |  20  |  30  |
|  5  |  E   |  20  |  40  |  70  |

위 표에서 인덱스는 ID에만 적용되어 있기 때문에 모든 학생들의 수학 점수를 비교하기 위해서는 테이블의 모든 데이터를 살펴보아야 한다. 좀 더 빠른 탐색을 위해 수학 점수에 인덱스를 적용하면 아래와 같이 오름차순으로 정렬된 인덱스 표가 생성된다.

| 수학 | ID  |
| :--: | :-: |
|  20  |  4  |
|  40  |  5  |
|  55  |  3  |
|  70  |  1  |
|  85  |  2  |

수학점수가 가장 낮은 학생의 이름을 찾기 위해서는 인덱스 테이블의 첫 번째 행의 ID로 학생 점수 테이블의 이름을 탐색하면 되므로 매우 빠른 탐색이 가능해진다. 이렇듯 인덱스의 핵심은 탐색 범위를 최소화하는 것이다.

# 2. 인덱스의 자료구조

인덱스의 자료구조(B+Tree)를 다루기 전에 다른 자료구조 먼저 간단히 살펴보자. 탐색이 빠른 자료구조에는 해시맵(Hash Map), 리스트(List), 이진 탐색 트리(Binary Search Tree)가 있다.

## 2.1. 해시맵(Hash Map)

해시맵은 `key=value`형태의 자료구조이며, `key`의 해시코드를 기반으로 데이터를 저장한다. 이는 `key`에 해당하는 값만 탐색하므로 단건 검색 시에는 `O(1)`의 시간복잡도로 매우 빠른 속도를 보이나, 특정한 조건 범위를 탐색할 때에는 모든 값을 탐색해아 하므로 `O(N)`의 시간복잡도로 느린 편에 속한다. 또한, 해시맵은 LIKE "A%"와 같은 전방 일치 탐색을 지원하지 않는데, 그 이유는 다음과 같다.

- 해시 함수의 특성 : 해시 함수는 데이터 입력에 대해 한정된 범위의 고유한 해시 코드를 생성한다. 전방 일치 탐색을 위해서는 일부분만 일치하는 것을 찾아야 하는데, 일반적인 해시 함수는 이러한 특성이 없으므로 전방 일치 탐색에는 적합하지 않다.
- 해시 충돌 가능성 : 위 특성에서 언급하였듯이 해시 함수는 고유한 해시 코드를 생성해야 하나, 경우에 따라서는 서로 다른 `key`에 대해 동일한 해시 코드가 생성될 수 있다(해시 충돌). 해시맵에서 전방 일치 탐색을 지원하기 위해서는 해시 충돌 발생 시의 방안을 마련해야 하는데, 해시맵에서는 이 문제를 해결하기 어렵다.
- 성능 저하 : 해시맵에서 값을 탐색할 때, `key`를 해시 코드로 변환환 후 해당 위치에 접근하여 값을 탐색한다. 그런데 전방 일치 탐색은 일부분만 일치하는 값을 찾는 것이므로 결국 해시맵의 모든 값을 순회해야만 한다. 따라서, 해시맵을 통해 전방 일치 탐색을 수행하는 경우 성능상의 문제가 발생할 수 있다.

## 2.2. 리스트(List)

리스트는 데이터를 순서대로 저장하는 선형 자료 구조이다. 프로그래밍에서 Zero Based Index의 배열을 떠올리면 쉽다. 리스트에서 값을 탐색할 떄 주로 이진 탐색 알고리즘(`O(logN)`)을 사용하는데, 이는 리스트가 정렬되었다는 가정 하에 동작하는 효율적인 알고리즘이므로, 정렬되지 않은 리스트의 탐색의 시간복잡도는 `O(N)` 이다.

> 이진 탐색 알고리즘을 한 줄로 요약하면, 가운데 원소의 값을 기준으로 탐색하고자 하는 값과의 크기를 비교하여 절반씩 범위를 좁혀가는 알고리즘이다(탐색하고자 하는 값보다 크면 가운데 값 기준 우측 탐색, 반대는 좌측 탐색, 탐색 범위가 없으면 탐색 종료).

리스트는 주로 연속적인 메모리에 값을 저정하기 때문에 중간 삽입 또는 삭제가 발생하는 경우 해당 위치의 모든 원소를 이동시켜야 하므로 비용이 매우 크다는 단점이 있으나, 읽기 연산이 빠르다는 장점이 있다.

## 3.3. 이진 탐색 트리(Tree)

트리는 영문 뜻 그대로 나무처럼 가지치기한 형태의 자료구조이며, 최상위 노드(root)를 시작으로 부모-자식 노드가 여러 세대에 거쳐 연결된 형태이다. 트리는 높이에 따라 시간 복잡도가 결정되며, 트리의 높이를 최소화하는 트리에는 대표적으로 B+Tree가 있다.

> 여기서 나온 B+Tree가 주로 데이터베이스 인덱스의 자료구조로 사용된다.

이진 탐색 트리는 각 노드가 최대 2개의 자식 노드만을 가지며, 자식 노드 중 왼쪽은 현재 노드보다 작은 값, 오른쪽은 현재 노드보다 큰 값을 가진다. 이진 탐색 트리는 위에서 언급한 이진 탐색 알고리즘으로 값을 탐색하여 빠른 탐색이 가능하고, 이진 탐색 알고리즘과 유사한 방식으로 데이터를 삽입하므로 데이터 삽입에도 효율적이다. 데이터를 삭제할 때에는 삭제하려는 노드의 종류(자식 노드인 경우, 자식노드가 하나인 경우, 자식노드가 둘인 경우)에 따라 다르게 동작하나 대체적으로는 비용이 적은 편에 속한다. 이진 탐색 트리는 균형을 유지했을 때 `O(logN)`이지만, 한쪽으로 치우져 있을 때 최악의 경우 `O(N)`까지 될 수 있다.

## 3.4. B+Tree

B+Tree는 데이터베이스 인덱스나 파일 시스템에서 주로 사용되는 자료구조이며, 내부 노드와 리프 노드로 구성된다.

> B+Tree에 대해 검색해보면 반드시 붙은 또 다른 트리가 BTree이다(`B+Tree는 BTree의 변형으로...`). 수업 시간에 코드를 짜보긴 했는데, 교수님 코드를 따라 치느라 정신 없었던 기억만 남아 있다. 직접 구현한 적은 한 번도 없으므로 추후 직접 코드로 구현한 후 다른 글로 정리해보아야겠다.

내부 노드는 키값과 함께 여러 개의 자식 노드를 가진다. 데이터는 리프 노드에만 존재하며, 모든 리프 노드는 연결 리스트로 연결되어 있으므로 범위 검색과 순차적 접근 시 매우 효율적이다. 또한, 리프 노드는 모두 연결되어 있으므로 범위 탐색에도 효율적이며, 데이터를 추가하거나 삭제할 때 리프 노드만 수정하면 되므로 삽입과 삭제에도 효율적이라고 한다.

> Tree와 이진 트리 탐색 아이디어를 알고 있어서 그런지 개념 자체는 어렵지 않았다. 근데 코드로 구현하려고 하면 정수리가 따끈거린다(이진 탐색 트리의 장점, 연결 리스트의 특징, 이진 탐색 알고리즘을 전부 다 합치면 B+Tree가 되지 않을까 싶다). 누군가 B+Tree의 동작 방식을 눈으로 직접 볼 수 있게 구현한 웹 페이지가 있는데, 아래 링크를 들어가면 볼 수 있다.

- [B+Tree - 눈으로 보기](https://www.cs.usfca.edu/~galles/visualization/BPlusTree.html)

# 3. 인덱스 적용 실습

실습 내용은 다음과 같다.

> 회원(member), 게시글(post) 테이블 생성
> 회원 데이터 500개, 게시글 데이터 100만개 입력
> 회원 ID가 1인 member의 게시글은 총 50만 개
> 게시글의 등록일자(date, createdAt과는 다름)는 `2023-01-01`~`2023-12-31` 중 랜덤
> 회원 ID가 1인 게시글의 일자별 등록 개수 조회

쿼리는 아래와 같으며, 쿼리 상세 내용을 보기 위하여 앞에 `EXPLAIN`을 붙여 한 번 더 쿼리 실행

- [GitHub/choewy/sns-for-traffic-study](https://github.com/choewy/sns-for-traffic-study)

```sql
SELECT `memberId`, `date`, COUNT(id) as `count`
FROM `post`
WHERE  `memberId` = 1
  AND `date` >= "2023-01-01"
  AND `date` <= "2023-12-31"
GROUP BY `date`
```

```sql
EXPLAIN
SELECT `memberId`, `date`, COUNT(id) as `count`
FROM `post`
WHERE  `memberId` = 1
  AND `date` >= "2023-01-01"
  AND `date` <= "2023-12-31"
GROUP BY `date`
```

## 3.1. 인덱스 없음, FK 미설정

- 쿼리 실행 속도 : 35,258 ms
- 분석 : 조건에 충족하는 값을 찾기 위하여 테이블의 모든 데이터 탐색

```ts
@Entity()
export class Post {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  readonly id: number;

  @Column({ type: 'varchar', length: 1024 })
  contents: string;

  @Column({ type: 'date' })
  date: Date;

  @CreateDateColumn()
  readonly createdAt: Date;

  @Column({ type: 'int', unsigned: true })
  readonly memberId: number;
}
```

## 3.2. date 컬럼 인덱스 설정, FK 미설정

- 쿼리 실행 속도 : 28,258 ms
- 결과 : date만 인덱스를 타므로 조건에 조건에 충족하는 값을 찾기 위하여 테이블의 모든 데이터 탐색

```ts
@Entity()
export class Post {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  readonly id: number;

  @Column({ type: 'varchar', length: 1024 })
  contents: string;

  @Index('post_index_date')
  @Column({ type: 'date' })
  date: Date;

  @CreateDateColumn()
  readonly createdAt: Date;

  @Column({ type: 'int', unsigned: true })
  readonly memberId: number;
}
```

## 3.3. 인덱스 없음, member FK 설정

- 쿼리 실행 속도 : 29,026 ms
- 결과 : memberId만 인덱스를 타므로 조건에 충족하는 값을 찾기 위하여 테이블의 모든 데이터 탐색

```ts
@Entity()
export class Post {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  readonly id: number;

  @Column({ type: 'varchar', length: 1024 })
  contents: string;

  @Column({ type: 'date' })
  date: Date;

  @CreateDateColumn()
  readonly createdAt: Date;

  @ManyToOne(() => Member, (e) => e.posts, { onDelete: 'CASCADE' })
  @JoinColumn()
  readonly member: Member;
}
```

## 3.4. date 컬럼 인덱스 설정, member FK 설정

- 쿼리 실행 속도 : 28,913 ms
- 결과 : memberId만 인덱스를 타므로 조건에 충족하는 값을 찾기 위하여 테이블의 모든 데이터 탐색

```ts
@Entity()
export class Post {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  readonly id: number;

  @Column({ type: 'varchar', length: 1024 })
  contents: string;

  @Index('post_index_date')
  @Column({ type: 'date' })
  date: Date;

  @CreateDateColumn()
  readonly createdAt: Date;

  @ManyToOne(() => Member, (e) => e.posts, { onDelete: 'CASCADE' })
  @JoinColumn()
  readonly member: Member;
}
```

## 3.5. 복합 인덱스 설정(date, member FK 순)

- 쿼리 실행 속도 : 132 ms
- 결과
  - 인덱스 테이블에서 date, memberId 순으로 데이터를 탐색하므로 속도가 매우 빨라진 것을 확인할 수 있음
  - memberId를 2로 검색하는 경우 오히려 검색 시간이 상대적으로 느림(171 ms)
  - member의 게시글 수와 무관하게 게시글의 date 먼저 탐색

```ts
@Index('post_index_date_member_id', ['date', 'member.id'])
@Entity()
export class Post {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  readonly id: number;

  @Column({ type: 'varchar', length: 1024 })
  contents: string;

  @Column({ type: 'date' })
  date: Date;

  @CreateDateColumn()
  readonly createdAt: Date;

  @ManyToOne(() => Member, (e) => e.posts, { onDelete: 'CASCADE' })
  @JoinColumn()
  readonly member: Member;
}
```

## 3.6. 복합 인덱스 설정(member FK, date 컬럼 순)

- 쿼리 실행 속도 : 130 ms
- 결과
  - 인덱스 테이블에서 memberId, date 순으로 데이터를 탐색하므로 속도가 매우 빨라진 것을 확인할 수 있음
  - memberId를 2로 검색하는 경우 검색 속도가 매우 빨라짐(7 ms)
  - member의 게시글 수가 더 적을수록 더 적은 수의 게시글 탐색

```ts
@Index('post_index_member_id_date', ['member.id', 'date'])
@Entity()
export class Post {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  readonly id: number;

  @Column({ type: 'varchar', length: 1024 })
  contents: string;

  @Column({ type: 'date' })
  date: Date;

  @CreateDateColumn()
  readonly createdAt: Date;

  @ManyToOne(() => Member, (e) => e.posts, { onDelete: 'CASCADE' })
  @JoinColumn()
  readonly member: Member;
}
```

# 마치며

대학 강의에서 들었던 내용이고, 알고 있던 내용이긴 하지만 제대로 알고 있진 못한 것 같다. 왜냐하면, 설명을 제대로 할 수 없겠다고나 할까... 실제 프로덕션에서 쿼리 성능이 낮으면 Index를 타는지 보고 때로는 그에 맞는 Index를 적용할 수 있긴 하겠으나, 마치 머릿속에서 제대로 정립된 하나의 개념이 아니라 실무에서 터득한 감각이라고 표현할 수 있겠다.

> 이전 회사에서 조차 NestJS + TypeORM 조합을 사용하면서 직접 데이터베이스의 Index를 건드리는 경우가 거의 없었다. 기껏 해봐야 위의 예제와 같은 경우에 복합 인덱스 적용 정도가 있겠다.

이번에 인덱스에 대해서 다시 복습해보고 다양한 상황을 놓고 쿼리를 튜닝해보는 실습 과정을 통해 머릿속에서 꽤나 정리가 된 듯 하다. 대용량 트래픽 처리에 관련된 공부가 끝나면 BTree, B+Tree에 대해서 포스팅해보겠다.
