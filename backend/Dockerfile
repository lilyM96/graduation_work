# ベースにするイメージを指定
# FROM ruby:latest
FROM ruby:3.2.2

# Rails・DB接続に必要なパッケージをインストール
# RUN apt-get update -qq && apt-get install -y build-essential libpq-dev nodejs default-mysql-client vim
RUN apt-get update -qq && apt-get install -y build-essential libpq-dev nodejs vim

# コンテナ内にディレクトリを作成
RUN mkdir /api
# 作成したディレクトリを作業用ディレクトリとして設定
WORKDIR /api
# ローカルの Gemfile と Gemfile.lock をコンテナ内のディレクトリ配下にコピー
# RUN gem install bundler:2.3.17
COPY Gemfile /api/Gemfile
COPY Gemfile.lock /api/Gemfile.lock
# コンテナ内にコピーした Gemfile の bundle install
RUN gem update --system 3.4.6
RUN bundle install

# ローカルのファイルをコンテナ内のディレクトリ配下にコピー
COPY . /api

COPY entrypoint.sh /usr/bin/
RUN chmod +x /usr/bin/entrypoint.sh
ENTRYPOINT ["entrypoint.sh"]

# サーバー起動
CMD ["rails", "server", "-b", "0.0.0.0"]