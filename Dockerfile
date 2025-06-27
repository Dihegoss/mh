# Use a imagem base do Python
FROM python:3.12.5-slim

# Defina as variáveis de ambiente
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV LD_LIBRARY_PATH /usr/lib/oracle/21.14.0.0.0dbru/lib/${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}
ENV ORACLE_HOME /usr/lib/oracle/21.14.0.0.0dbru
ENV PATH $PATH:$ORACLE_HOME/bin

# Defina o diretório de trabalho
WORKDIR /mhdigital

# Atualize a lista de pacotes e instale dependências necessárias
RUN apt-get update && apt-get install -y \
    libaio1 \
    wget \
    unzip \
    gcc \
    g++ \
    make \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Baixe e instale o Oracle Instant Client
RUN mkdir -p /usr/lib/oracle/21.14.0.0.0dbru/lib && \
    cd /tmp && \
    wget https://download.oracle.com/otn_software/linux/instantclient/2114000/instantclient-basic-linux.x64-21.14.0.0.0dbru.zip && \
    unzip instantclient-basic-linux.x64-21.14.0.0.0dbru.zip && \
    cp -r instantclient_21_14/* /usr/lib/oracle/21.14.0.0.0dbru/lib/ && \
    rm -rf /tmp/instantclient* && \
    rm -rf /tmp/instantclient-basic-linux.x64-21.14.0.0.0dbru.zip

# Copie o arquivo requirements.txt para o container
COPY requirements.txt /mhdigital

# Instale as dependências do Python
RUN pip install -r requirements.txt

# Remova as ferramentas de compilação para reduzir o tamanho da imagem
RUN apt-get remove -y gcc g++ make python3-dev && \
    apt-get autoremove -y && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copie o restante dos arquivos para o container
COPY . /mhdigital/

# Exponha a porta 8000
EXPOSE 8000

# Defina o comando padrão para iniciar o servidor
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]