# Peer-to-Peer File Sharing System

Este proyecto implementa un sistema de intercambio de archivos entre pares (P2P) utilizando una arquitectura cliente-servidor y tecnologías como gRPC, Express.js y SQLite.

## Estructura del Proyecto

El proyecto está dividido en dos componentes principales: `Pcliente` y `Pservidor`.

### Pcliente

El cliente P2P (`Pcliente`) es responsable de anunciar los archivos disponibles y descargar archivos de otros pares. Está escrito en Node.js y utiliza Express.js para el servidor web y gRPC para la comunicación entre pares.

#### Configuración

- **Puerto de Escucha**: 3000 (configurable)
- **Puerto gRPC**: 50051 (configurable)

#### Dependencias Principales

- `@grpc/grpc-js`: Para implementar la comunicación gRPC.
- `@grpc/proto-loader`: Para cargar archivos de definición de protocolo protobuf.
- `axios`: Para realizar solicitudes HTTP.
- `express`: Para el servidor web.

### Pservidor

El servidor central (`Pservidor`) es responsable de mantener un registro de los pares activos y los archivos que ofrecen. También proporciona una interfaz de consulta para listar archivos disponibles.

#### Configuración

- **Puerto de Escucha**: 3000 (configurable)
- **Puerto gRPC**: 50051 (configurable)

#### Dependencias Principales

- `@grpc/grpc-js`: Para implementar la comunicación gRPC.
- `@grpc/proto-loader`: Para cargar archivos de definición de protocolo protobuf.
- `express`: Para el servidor web.
- `sqlite3`: Para interactuar con la base de datos SQLite.

## Instrucciones de Uso

1. **Instalación**: Clonar este repositorio y ejecutar `npm install` en los directorios `Pcliente` y `Pservidor`.
2. **Configuración**: Verificar los puertos de escucha en `index.js` de cada componente.
3. **Inicio**: Ejecutar los servidores con los comandos proporcionados en los scripts `start` o `startP*` en los directorios `Pcliente` y `Pservidor`.
4. **Operación**: Utilizar la API proporcionada para cargar archivos, listar archivos disponibles y descargar archivos de otros pares.

## Consideraciones Importantes

- **Conexión Segura**: Este sistema no implementa cifrado de extremo a extremo. Se recomienda utilizar en una red segura.
- **Disponibilidad**: La disponibilidad de archivos depende de la actividad de los pares en línea. Los archivos pueden no estar disponibles si los pares se desconectan.
- **Escalabilidad**: Este sistema puede escalarse agregando más pares y servidores para aumentar la capacidad de intercambio de archivos.
- 
## Licencia

Este proyecto está bajo la Licencia [MIT](enlace-a-licencia).
