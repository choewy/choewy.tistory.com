# 들어가며

지난 글에 이어 MacOS(M2)에서 Docker로 PalWorld 서버를 구축하는 내용을 정리해보았다.

> M1, M2 MacOS 뿐만 아니라 ARM Linux도 적용 가능할 것이라 생각한다. 만약, 본인의 Mac이 Intel Chip인 경우 본 글을 볼 필요가 없다.

누군가 벌써 Docker Hub에 Image를 올려놓았고, 해당 이미지를 그대로 활용하였다.

- [DockerHub - nitrog0d/palworld-arm64](https://hub.docker.com/r/nitrog0d/palworld-arm64)

# 1. 사전 준비

Docker로 서버를 실행할 것이기에 당연히 Docker가 설치되어 있어야한다. 아래 링크에서 `Docker Desktop for Mac with Apple silicon` 버튼을 클릭하여 Docker Desktop을 설치한다.

팔월드의 최소 사양은 아래와 같으며, 멀티 플레이어 시 게임 성능 향상을 위해 Docker Desktop에서 Resources를 적절히 조정해주는 편이 좋다.

| 구분   | 최소사양                          |
| ------ | --------------------------------- |
| OS     | Windows10 or later 64-bit         |
| CPU    | Intel Core i5-3570K 3.4GHz 4 Core |
| Memory | 16 GB RAM                         |
| GPU    | NVIDIA GeForce GTX 1050 (2 GB)    |

Docker Desktop을 실행하여 우측 상단에 위치한 톱니바퀴 버튼을 클릭 후 `Resources` 메뉴를 클릭하면 CPU 가용수와 Memory 용량, 가상 디스크 용량을 설정할 수 있다.

# 2. 폴더 생성

팔월드 서버를 실행하려는 폴더를 생성한다. 이 글에서 폴더의 경로는 `~/Desktop/palworld`로 하였다.

```bash
mkdir ~/Desktop/palworld
```

이어서 생성된 폴더로 이동 후 `docker-compose.yaml` 파일을 생성한다.

```bash
cd ~/Desktop/parworld

touch docker-compose.yaml
```

생성된 `docker-compose.yaml` 파일에 아래 코드를 그대로 복붙해준다.

```yaml
version: '3.8'

name: 'palworld'

services:
  palworld-server:
    image: 'nitrog0d/palworld-arm64:latest'
    container_name: 'palworld-server'
    ports:
      - '8211:8211/udp'
    environment:
      - ALWAYS_UPDATE_ON_START=true
      - MULTITHREAD_ENABLED=true
      - COMMUNITY_SERVER=false
    restart: 'unless-stopped'
    volumes:
      - './data:/palworld'
```

# 3. 서버 설정

## 3.1. 서버 설정 파일 생성

`~/Desktop/parworld`에 위치한 터미널에 아래 명령어로 컨테이너를 실행한다.

```bash
docker-compose up -d
```

팔월드 서버가 실행되고, `~/Desktop/palworld/data`에 팔월드 서버 기본 설정 파일(`DefaultPalWorldSettings.ini`)이 생성된다. 서버 설정 후 재실행을 위해 아래 명령어를 입력하여 서버를 종료시킨다.

```bash
docker-compose down
```

팔월드 서버 기본 설정 파일의 내용을 그대로 복사한 후 `~/Desktop/palworld/data/Pal/Saved/Config/LinuxServer/PalWorldSettings.ini` 파일에 그대로 붙여넣고, 아래 내용을 참고하여 서버를 설정할 수 있다.

## 3.2. 서버 설정값 변경

`~/Desktop/palworld/data/Pal/Saved/Config/LinuxServer/PalWorldSettings.ini` 파일의 기본 텍스트는 다음과 같다.

```ini
[/Script/Pal.PalGameWorldSettings]
OptionSettings=(Difficulty=None,DayTimeSpeedRate=1.000000,NightTimeSpeedRate=1.000000,ExpRate=1.000000,PalCaptureRate=1.000000,PalSpawnNumRate=1.000000,PalDamageRateAttack=1.000000,PalDamageRateDefense=1.000000,PlayerDamageRateAttack=1.000000,PlayerDamageRateDefense=1.000000,PlayerStomachDecreaceRate=1.000000,PlayerStaminaDecreaceRate=1.000000,PlayerAutoHPRegeneRate=1.000000,PlayerAutoHpRegeneRateInSleep=1.000000,PalStomachDecreaceRate=1.000000,PalStaminaDecreaceRate=1.000000,PalAutoHPRegeneRate=1.000000,PalAutoHpRegeneRateInSleep=1.000000,BuildObjectDamageRate=1.000000,BuildObjectDeteriorationDamageRate=1.000000,CollectionDropRate=1.000000,CollectionObjectHpRate=1.000000,CollectionObjectRespawnSpeedRate=1.000000,EnemyDropItemRate=1.000000,DeathPenalty=All,bEnablePlayerToPlayerDamage=False,bEnableFriendlyFire=False,bEnableInvaderEnemy=True,bActiveUNKO=False,bEnableAimAssistPad=True,bEnableAimAssistKeyboard=False,DropItemMaxNum=3000,DropItemMaxNum_UNKO=100,BaseCampMaxNum=128,BaseCampWorkerMaxNum=15,DropItemAliveMaxHours=1.000000,bAutoResetGuildNoOnlinePlayers=False,AutoResetGuildTimeNoOnlinePlayers=72.000000,GuildPlayerMaxNum=20,PalEggDefaultHatchingTime=72.000000,WorkSpeedRate=1.000000,bIsMultiplay=False,bIsPvP=False,bCanPickupOtherGuildDeathPenaltyDrop=False,bEnableNonLoginPenalty=True,bEnableFastTravel=True,bIsStartLocationSelectByMap=True,bExistPlayerAfterLogout=False,bEnableDefenseOtherGuildPlayer=False,CoopPlayerMaxNum=4,ServerPlayerMaxNum=32,ServerName="Default Palworld Server",ServerDescription="",AdminPassword="",ServerPassword="",PublicPort=8211,PublicIP="",RCONEnabled=False,RCONPort=25575,Region="",bUseAuth=True,BanListURL="https://api.palworldgame.com/api/banlist.txt")
```

변경하고자 하는 키값을 아래 링크에서 검색 후 알맞은 값으로 변경한다.

> 이때, 띄어쓰기, 따옴표, 설정 가능한 값의 범위를 주의하도록 하자.

- [PalWorld 멀티 서버 설정하는 방법](https://diary-developer.tistory.com/41#toc2)
- [팰월드 전용서버 설정하기](https://gibgabsu.tistory.com/entry/%ED%8C%94%EC%9B%94%EB%93%9C-%EC%A0%84%EC%9A%A9%EC%84%9C%EB%B2%84-%EC%84%A4%EC%A0%95%ED%95%98%EA%B8%B0-Palworld-sever-setting)

# 4. 서버 실행

`~/Desktop/parworld`에 위치한 터미널에 아래 명령어로 컨테이너를 실행하면 설정이 재적용된 상태로 서버가 실행된다.

```bash
docker-compose up -d
```

# 마치며

Mac M1/M2용 Palworld 서버 도커 이미지를 만들기 위해 하루종일 시도했지만 SteamCMD에 막히고 말았다. 누군가 벌써 올려놓은 Docker Image가 있었고 그냥 해당 이미지를 이용하기로 하였다. 역시 세상은 넓고 실력자들은 많은 것 같다. 굳이 맥북으로 팔월드 서버를 구동시키고 있다는 자체가 자원을 낭비하고 있다는 것일 수도 있다. 어쩔 수 없는 상황에서 Mac으로 팔월드 서버를 구축하려는 이들에게 도움이 되었으면 한다.
