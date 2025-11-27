FROM flyway/flyway:10-alpine

# Copy migrations to the expected Flyway location
COPY ./sql /flyway/sql

# Non-root user for security
RUN adduser -D flyway
USER flyway

# Health check - verify migrations can run
HEALTHCHECK --interval=5s --timeout=10s --retries=3 \
  CMD flyway info || exit 1

# Run migrations - just migrate, no repair needed
# If you need to see migration info: CMD ["info"]
CMD ["migrate"] 
