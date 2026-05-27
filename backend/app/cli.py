from app.db.seed import seed_database
from app.db.session import SessionLocal, init_db


def seed() -> None:
    init_db()
    with SessionLocal() as db:
        seed_database(db)
    print("Seed data ready.")


if __name__ == "__main__":
    seed()
