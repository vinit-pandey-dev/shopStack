  FROM node:20-alpine AS frontend
  WORKDIR /web
  COPY frontend-react/package*.json ./
  RUN npm ci
  COPY frontend-react/ ./
  ENV VITE_API_BASE=/api
  RUN npm run build

  FROM maven:3.9-eclipse-temurin-17 AS backend
  WORKDIR /app
  COPY backend/pom.xml ./
  RUN mvn -q -B dependency:go-offline
  COPY backend/src ./src
  COPY --from=frontend /web/dist ./src/main/resources/static
  RUN mvn -q -B package -DskipTests

  FROM eclipse-temurin:17-jre
  WORKDIR /app
  COPY --from=backend /app/target/ecommerce-1.0.0.jar app.jar
  ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75"
  EXPOSE 8080
  CMD ["java", "-jar", "app.jar"]