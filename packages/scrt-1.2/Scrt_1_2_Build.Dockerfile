FROM rust:1.57
# install toolchain
RUN rustup target add wasm32-unknown-unknown
# install extra dependencies
ENV PACKAGES binaryen sudo git clang
RUN apt update && apt install -y $PACKAGES && rm -rf /var/lib/apt/lists/*
# ensure registry exists
ENV REGISTRY /usr/local/cargo/registry
RUN mkdir -p "$REGISTRY"
# default $USER and $GROUP to switch to
ENV USER 1000
ENV GROUP 1000
# ensure mountpoint for source
WORKDIR /src

# mounted instead:
#ADD ScrtBuild_1_2.sh /entrypoint.sh
#RUN chmod +x /entrypoint.sh
#ENTRYPOINT [ "/entrypoint.sh" ]
