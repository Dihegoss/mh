# MH-Digital - Documentação Docker

## 📋 Visão Geral

Este documento explica como o projeto MH-Digital está configurado para funcionar com Docker, incluindo desenvolvimento local e deploy em produção.

## 🏗️ Arquitetura

O projeto usa uma arquitetura Docker com:
- **Aplicação Django** (container `mhdigital`)
- **Banco PostgreSQL** (container `db`)
- **Oracle Instant Client** (integrado na imagem da aplicação)

## 📁 Estrutura de Arquivos

```
mhdigital/
├── Dockerfile              # Configuração da imagem da aplicação
├── docker-compose.yml      # Orquestração dos serviços
├── .dockerignore           # Arquivos ignorados no build
├── .gitlab-ci.yml          # Pipeline de CI/CD
├── env-example.txt         # Exemplo de variáveis de ambiente
├── .env                    # Variáveis locais (criar a partir do exemplo)
├── requirements.txt        # Dependências Python
└── ...
```

---

## 🐳 Dockerfile

### **Propósito**
Define como construir a imagem Docker da aplicação Django com suporte ao Oracle.

### **Configuração Atual**

```dockerfile
# Imagem base otimizada
FROM python:3.12.5-slim

# Variáveis de ambiente do Oracle
ENV LD_LIBRARY_PATH /usr/lib/oracle/21.14.0.0.0dbru/lib/${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}
ENV ORACLE_HOME /usr/lib/oracle/21.14.0.0.0dbru
ENV PATH $PATH:$ORACLE_HOME/bin

# Instalação de dependências do sistema
RUN apt-get update && apt-get install -y \
    libaio1 wget unzip gcc g++ make python3-dev

# Download automático do Oracle Instant Client
RUN wget https://download.oracle.com/otn_software/linux/instantclient/2114000/instantclient-basic-linux.x64-21.14.0.0.0dbru.zip && \
    unzip instantclient-basic-linux.x64-21.14.0.0.0dbru.zip && \
    cp -r instantclient_21_14/* /usr/lib/oracle/21.14.0.0.0dbru/lib/

# Instalação das dependências Python
COPY requirements.txt /mhdigital
RUN pip install -r requirements.txt

# Limpeza para reduzir tamanho da imagem
RUN apt-get remove -y gcc g++ make python3-dev && \
    apt-get autoremove -y && apt-get clean

# Cópia do código da aplicação
COPY . /mhdigital/
```

### **Otimizações Implementadas**

#### ✅ **Download Automático do Oracle**
- Oracle Client é baixado durante o build
- Não precisa copiar arquivos pesados (136MB+)
- Cache eficiente do Docker

#### ✅ **Imagem Otimizada**
- Usa `python:3.12.5-slim` (menor)
- Remove ferramentas de compilação após uso
- Limpa cache do apt

#### ✅ **Cache Eficiente**
- Oracle só é baixado quando necessário
- Mudanças no código não invalidam cache do Oracle
- Build mais rápido para desenvolvimento

---

## 📦 .dockerignore

### **Propósito**
Exclui arquivos desnecessários do contexto de build do Docker.

### **Arquivos Excluídos**

```
# Oracle Instant Client (baixado automaticamente)
oracle-instantclient_21_14/

# Arquivos de ambiente (passados via env_file)
.env
.env-*

# Arquivos de desenvolvimento
*.pyc, __pycache__/, .git/, .vscode/

# Logs e arquivos temporários
logs/, *.log, *.tmp

# Arquivos estáticos coletados
staticfiles/
```

### **Benefícios**
- ✅ **Build mais rápido**: Contexto menor
- ✅ **Cache eficiente**: Menos arquivos para monitorar
- ✅ **Segurança**: `.env` não vai para a imagem

---

## 🚀 docker-compose.yml

### **Propósito**
Orquestra os serviços da aplicação (Django + PostgreSQL).

### **Configuração**

```yaml
version: '3.8'

services:
  mhdigital:
    build: .                    # Constrói imagem localmente
    ports:
      - "8000:8000"            # Porta externa:interna
    volumes:
      - ./logs:/mhdigital/logs     # Logs persistentes
      - ./static:/mhdigital/static # Arquivos estáticos
    env_file:
      - .env                    # Variáveis de ambiente
    depends_on:
      - db                      # Dependência do banco
    restart: unless-stopped     # Reinicia automaticamente

  db:
    image: postgres:15          # Imagem oficial PostgreSQL
    environment:
      POSTGRES_DB: mhdigital_dev
      POSTGRES_USER: mhdigitaluser
      POSTGRES_PASSWORD: mhdigitalpass
    volumes:
      - postgres_data:/var/lib/postgresql/data  # Dados persistentes
    ports:
      - "5432:5432"            # Porta do banco
    restart: unless-stopped
```

### **Características**

#### ✅ **Desenvolvimento Local**
- Build da imagem local
- Volumes para logs e estáticos
- Banco de dados persistente

#### ✅ **Compatível com CI/CD**
- Estrutura padrão
- Comandos `docker compose build` e `docker compose up -d`
- Variáveis de ambiente via `env_file`

---

## 🔄 .gitlab-ci.yml

### **Propósito**
Pipeline de CI/CD para deploy automático em produção.

### **Configuração**

```yaml
stages:
  - deploy

deploy_job:
  stage: deploy
  before_script:
    # Configuração SSH para acesso ao servidor
    - apk add --update openssh
    - eval $(ssh-agent -s)
    - echo "$SSH_PRIVATE_KEY_HML" | tr -d '\r' | ssh-add -
    - mkdir -p ~/.ssh
    - ssh-keyscan -H $SSH_HOST_HML >> ~/.ssh/known_hosts
  
  script:
    # Limpa diretório anterior
    - ssh $SSH_USER@$SSH_HOST_HML "cd $WORK_DIR && rm -rf $DIR_PROJECT_NAME_HML"
    
    # Clona repositório no servidor
    - ssh $SSH_USER@$SSH_HOST_HML "cd $WORK_DIR && git clone -b develop $PROTOCOLO$REPOSITORY_NAME:$PROJECT_TOKEN@$REPOSITORY_URL $DIR_PROJECT_NAME_HML"
    
    # Constrói imagem no servidor
    - ssh $SSH_USER@$SSH_HOST_HML "cd $WORK_DIR && docker compose build $COMPOSE_SERVICE_HML"
    
    # Deploy do container
    - ssh $SSH_USER@$SSH_HOST_HML "cd $WORK_DIR && docker compose up -d $COMPOSE_SERVICE_HML"

  only:
    - develop  # Executa apenas na branch develop
```

### **Fluxo de Deploy**

1. **Trigger**: Push para branch `develop`
2. **SSH**: Conecta ao servidor de produção
3. **Clone**: Baixa código atualizado
4. **Build**: Constrói imagem com Oracle incluído
5. **Deploy**: Inicia container com nova versão

---

## 🔐 Variáveis de Ambiente

### **Estrutura**

#### **env-example.txt**
Arquivo de exemplo com todas as variáveis necessárias:

```bash
# Django
DEBUG=True
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=localhost,127.0.0.1

# Banco de Dados
DB_ENGINE=django.db.backends.postgresql
DB_NAME=mhdigital_dev
DB_USER=mhdigitaluser
DB_PASSWORD=your-database-password-here
DB_HOST=db
DB_PORT=5432

# Acesso Cidadão
ACESSO_CIDADAO_CLIENT_ID=your-client-id-here
ACESSO_CIDADAO_CLIENT_SECRET=your-client-secret-here
ACESSO_CIDADAO_AUTHORIZATION_ENDPOINT=https://acessocidadao.es.gov.br/is/connect/authorize
ACESSO_CIDADAO_TOKEN_ENDPOINT=https://acessocidadao.es.gov.br/is/connect/token
ACESSO_CIDADAO_USERINFO_ENDPOINT=https://acessocidadao.es.gov.br/is/connect/userinfo
ACESSO_CIDADAO_LOGOUT_ENDPOINT=https://acessocidadao.es.gov.br/is/logout

# Oracle MV
MV_HRAS_HOST=your-oracle-host-here
MV_HRAS_PORT=1521
MV_HRAS_SERVICE=your-oracle-service-here
MV_HRAS_USER=your-oracle-user-here
MV_HRAS_PASSWORD=your-oracle-password-here

# Debug
DEBUG_MODE=True
DEBUG_TOKEN=your-debug-token-here
```

#### **/opt/mhdigital/.env**
Arquivo de produção no servidor com valores reais e permissões restritas.

### **Como Funciona**

#### ✅ **Desenvolvimento Local**
```bash
# 1. Criar arquivo .env local
copy env-example.txt .env

# 2. Editar variáveis
notepad .env

# 3. Docker Compose carrega variáveis
docker-compose up -d
```

#### ✅ **Produção (Servidor)**
```bash
# 1. Configurar ambiente no servidor
sudo ./setup-server-env.sh

# 2. Editar variáveis
sudo nano /opt/mhdigital/.env

# 3. Docker Compose carrega variáveis do servidor
docker-compose up -d
```

### **Configuração de Segurança**

#### **Permissões do Arquivo**
```bash
# Apenas root pode ler/escrever
sudo chown root:root /opt/mhdigital/.env
sudo chmod 600 /opt/mhdigital/.env

# Verificar permissões
ls -la /opt/mhdigital/.env
# -rw------- 1 root root 1234 Jan 1 12:00 /opt/mhdigital/.env
```

#### **docker-compose.yml**
```yaml
services:
  mhdigital:
    env_file:
      - /opt/mhdigital/.env    # Caminho absoluto no servidor
```

### **Segurança**

#### ✅ **Boas Práticas**
- `.env` fica em `/opt/mhdigital/.env` (padrão Linux)
- Permissões `600` (apenas root pode ler/escrever)
- Proprietário `root:root`
- Caminho absoluto no `docker-compose.yml`
- Arquivo não vai para o Git (`.gitignore`)

#### ✅ **Fluxo Seguro**
```
Desenvolvimento: .env (máquina local) → Container
Produção: /opt/mhdigital/.env (servidor) → Container
```

---

## 🔄 Fluxo Completo

### **Desenvolvimento Local**

```bash
# 1. Configurar ambiente
copy env-example.txt .env
notepad .env

# 2. Construir e executar
docker-compose build
docker-compose up -d

# 3. Acessar aplicação
# http://localhost:8000
```

### **Deploy em Produção**

```bash
# 1. Push para branch develop
git push origin develop

# 2. No servidor de produção:
# - Configurar ambiente (primeira vez)
sudo ./setup-server-env.sh

# - Editar variáveis
sudo nano /opt/mhdigital/.env

# 3. CI/CD executa automaticamente:
# - Conecta ao servidor via SSH
# - Clona código atualizado
# - Constrói imagem com Oracle
# - Deploy do container

# 4. Aplicação disponível no servidor
```

---

## 🎯 Benefícios da Configuração

### ✅ **Desenvolvimento**
- **Rápido**: Cache eficiente do Docker
- **Flexível**: Fácil mudar variáveis
- **Consistente**: Mesmo ambiente para todos
- **Isolado**: Não afeta sistema local

### ✅ **Produção**
- **Automático**: Deploy via CI/CD
- **Seguro**: Variáveis protegidas
- **Escalável**: Fácil adicionar serviços
- **Confiável**: Containers isolados

### ✅ **Manutenção**
- **Simples**: Comandos padrão
- **Rastreável**: Logs organizados
- **Recuperável**: Rollback fácil
- **Documentado**: Configuração clara

---

## 🛠️ Comandos Úteis

### **Desenvolvimento**
```bash
# Construir imagem
docker-compose build

# Executar serviços
docker-compose up -d

# Ver logs
docker-compose logs -f mhdigital

# Parar serviços
docker-compose down

# Reconstruir (força cache)
docker-compose build --no-cache
```

### **Manutenção**
```bash
# Executar comando no container
docker-compose exec mhdigital python manage.py shell

# Backup do banco
docker-compose exec db pg_dump -U mhdigitaluser mhdigital_dev > backup.sql

# Verificar status
docker-compose ps

# Limpar tudo
docker-compose down -v
```

---

## 🔧 Troubleshooting

### **Problemas Comuns**

#### **Build falha com cx_Oracle**
- ✅ **Solução**: Dockerfile já inclui `gcc`, `g++`, `make`
- ✅ **Causa**: Dependências de compilação faltando

#### **Container para com erro de backend**
- ✅ **Verificar**: Variáveis de ambiente no `.env`
- ✅ **Causa**: Configuração incorreta do banco

#### **Porta já em uso**
- ✅ **Solução**: Mudar porta no `docker-compose.yml`
- ✅ **Causa**: Outro serviço usando porta 8000

#### **Oracle não conecta**
- ✅ **Verificar**: Configurações Oracle no `.env`
- ✅ **Causa**: Credenciais ou host incorretos

### **Logs de Debug**
```bash
# Ver logs da aplicação
docker-compose logs mhdigital

# Ver logs do banco
docker-compose logs db

# Ver logs em tempo real
docker-compose logs -f
```

---

## 📝 Conclusão

Esta configuração Docker oferece:

- ✅ **Desenvolvimento eficiente** com cache otimizado
- ✅ **Deploy automatizado** via CI/CD
- ✅ **Segurança** com variáveis protegidas
- ✅ **Flexibilidade** para diferentes ambientes
- ✅ **Manutenibilidade** com comandos simples

O projeto está pronto para desenvolvimento local e deploy em produção seguindo as melhores práticas do Docker.

---

## 🔧 Scripts de Configuração

### **setup-server-env.sh** (Linux/Produção)
Script para configurar o ambiente no servidor Linux com permissões de segurança.

#### **Uso**
```bash
# Executar como root ou com sudo
sudo ./setup-server-env.sh
```

#### **O que faz**
- ✅ Cria diretório `/opt/mhdigital/`
- ✅ Copia `env-example.txt` para `/opt/mhdigital/.env`
- ✅ Define permissões `600` (apenas root pode ler/escrever)
- ✅ Define proprietário `root:root`
- ✅ Cria grupo `mhdigital` para acesso controlado
- ✅ Adiciona usuário ao grupo (se necessário)

### **setup-server-env.bat** (Windows/Desenvolvimento)
Script para simular a configuração do servidor no Windows.

#### **Uso**
```cmd
# Executar como administrador
setup-server-env.bat
```

#### **O que faz**
- ✅ Cria diretório `C:\opt\mhdigital\`
- ✅ Copia `env-example.txt` para `C:\opt\mhdigital\.env`
- ✅ Define permissões restritas (apenas usuário atual)
- ✅ Simula ambiente de produção

### **Comandos Manuais**

#### **Linux (Produção)**
```bash
# Criar diretório
sudo mkdir -p /opt/mhdigital

# Copiar arquivo
sudo cp env-example.txt /opt/mhdigital/.env

# Definir permissões
sudo chown root:root /opt/mhdigital/.env
sudo chmod 600 /opt/mhdigital/.env

# Verificar
ls -la /opt/mhdigital/.env
```

#### **Windows (Desenvolvimento)**
```cmd
# Criar diretório
mkdir C:\opt\mhdigital

# Copiar arquivo
copy env-example.txt C:\opt\mhdigital\.env

# Definir permissões
icacls C:\opt\mhdigital\.env /inheritance:r /grant:r %USERNAME%:F
```

--- 