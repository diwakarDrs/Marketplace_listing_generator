"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-10-15
"""
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_now = sa.text("now()")


def _ts() -> list[sa.Column]:
    return [
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=_now, nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=_now, nullable=False),
    ]


def _cascade_fk(column: str, table: str) -> sa.Column:
    return sa.Column(
        column,
        sa.Integer(),
        sa.ForeignKey(f"{table}.id", ondelete="CASCADE"),
        nullable=False,
    )


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=True),
        sa.Column("full_name", sa.String(100), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("is_verified", sa.Boolean(), nullable=False),
        sa.Column("oauth_provider", sa.String(50), nullable=True),
        *_ts(),
    )
    op.create_index("ix_users_id", "users", ["id"])
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "refresh_tokens",
        sa.Column("id", sa.Integer(), primary_key=True),
        _cascade_fk("user_id", "users"),
        sa.Column("token_hash", sa.String(255), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=_now, nullable=False),
    )
    op.create_index("ix_refresh_tokens_id", "refresh_tokens", ["id"])
    op.create_index("ix_refresh_tokens_user_id", "refresh_tokens", ["user_id"])
    op.create_index("ix_refresh_tokens_token_hash", "refresh_tokens", ["token_hash"], unique=True)

    op.create_table(
        "seller_profiles",
        sa.Column("id", sa.Integer(), primary_key=True),
        _cascade_fk("user_id", "users"),
        sa.Column("name", sa.String(150), nullable=False),
        sa.Column("brand_name", sa.String(150), nullable=True),
        sa.Column("brand_voice", sa.Text(), nullable=True),
        sa.Column("default_marketplace", sa.String(30), nullable=True),
        sa.Column("default_language", sa.String(10), nullable=True),
        *_ts(),
    )
    op.create_index("ix_seller_profiles_id", "seller_profiles", ["id"])
    op.create_index("ix_seller_profiles_user_id", "seller_profiles", ["user_id"])

    op.create_table(
        "products",
        sa.Column("id", sa.Integer(), primary_key=True),
        _cascade_fk("user_id", "users"),
        sa.Column(
            "seller_profile_id",
            sa.Integer(),
            sa.ForeignKey("seller_profiles.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("category", sa.String(150), nullable=True),
        sa.Column("brand", sa.String(150), nullable=True),
        sa.Column("key_features", sa.JSON(), nullable=False),
        sa.Column("price", sa.Numeric(12, 2), nullable=True),
        sa.Column("target_audience", sa.String(255), nullable=True),
        sa.Column("attributes", sa.JSON(), nullable=False),
        *_ts(),
    )
    op.create_index("ix_products_id", "products", ["id"])
    op.create_index("ix_products_user_id", "products", ["user_id"])
    op.create_index("ix_products_seller_profile_id", "products", ["seller_profile_id"])
    op.create_index("ix_products_name", "products", ["name"])
    op.create_index("ix_products_category", "products", ["category"])

    marketplace = sa.Enum("amazon", "flipkart", "meesho", "shopify", name="marketplace")
    listing_status = sa.Enum("draft", "final", name="listing_status")
    op.create_table(
        "listings",
        sa.Column("id", sa.Integer(), primary_key=True),
        _cascade_fk("user_id", "users"),
        _cascade_fk("product_id", "products"),
        sa.Column("marketplace", marketplace, nullable=False),
        sa.Column("language", sa.String(10), nullable=False),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("bullets", sa.JSON(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("keywords", sa.JSON(), nullable=False),
        sa.Column("validation_warnings", sa.JSON(), nullable=False),
        sa.Column("model_used", sa.String(100), nullable=True),
        sa.Column("status", listing_status, nullable=False),
        *_ts(),
    )
    op.create_index("ix_listings_id", "listings", ["id"])
    op.create_index("ix_listings_user_id", "listings", ["user_id"])
    op.create_index("ix_listings_product_id", "listings", ["product_id"])
    op.create_index("ix_listings_marketplace", "listings", ["marketplace"])
    op.create_index("ix_listings_status", "listings", ["status"])
    op.create_index("ix_listings_user_marketplace", "listings", ["user_id", "marketplace"])

    op.create_table(
        "usage_records",
        sa.Column("id", sa.Integer(), primary_key=True),
        _cascade_fk("user_id", "users"),
        sa.Column("period", sa.String(7), nullable=False),
        sa.Column("generations_used", sa.Integer(), nullable=False),
        sa.Column("generations_limit", sa.Integer(), nullable=False),
        *_ts(),
        sa.UniqueConstraint("user_id", "period", name="uq_usage_user_period"),
    )
    op.create_index("ix_usage_records_id", "usage_records", ["id"])
    op.create_index("ix_usage_records_user_id", "usage_records", ["user_id"])


def downgrade() -> None:
    op.drop_table("usage_records")
    op.drop_table("listings")
    op.drop_table("products")
    op.drop_table("seller_profiles")
    op.drop_table("refresh_tokens")
    op.drop_table("users")
    sa.Enum(name="listing_status").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="marketplace").drop(op.get_bind(), checkfirst=True)
