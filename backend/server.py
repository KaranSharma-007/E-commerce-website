from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware

import os
import logging
import uuid
import jwt
import requests

from pathlib import Path
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr

from supabase import create_client

# ======================================================
# ENV SETUP
# ======================================================

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

# ======================================================
# CONFIG
# ======================================================

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_ROLE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY", SUPABASE_SERVICE_ROLE_KEY)

STRIPE_API_KEY = os.environ.get("STRIPE_API_KEY")
SHIPPING_RATE = 100.0  # ₹100 flat rate

# Frontend URL for CORS and redirects
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")

# Environment check
IS_PRODUCTION = os.getenv("ENVIRONMENT") == "production"

# ======================================================
# SUPABASE CLIENT
# ======================================================

supabase = create_client(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY
)

# ======================================================
# FASTAPI APP
# ======================================================

app = FastAPI(
    docs_url=None if IS_PRODUCTION else "/docs",
    redoc_url=None if IS_PRODUCTION else "/redoc",
    openapi_url=None if IS_PRODUCTION else "/openapi.json",
    title="E-Commerce API"
)
api_router = APIRouter(prefix="/api")

# ======================================================
# LOGGING
# ======================================================

logging.basicConfig(
    level=logging.INFO if not IS_PRODUCTION else logging.WARNING,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# ======================================================
# SECURITY MIDDLEWARE
# ======================================================

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """Add security headers to all responses"""
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

# ======================================================
# CORS CONFIGURATION
# ======================================================

logger.info(f"CORS allowed origins: {os.environ.get("CORS_ORIGINS","http://localhost:3000").split(",")}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("CORS_ORIGINS","http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ======================================================
# EXCEPTION HANDLERS
# ======================================================

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle all unhandled exceptions"""
    if IS_PRODUCTION:
        logger.error(f"Unhandled error: {exc}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"}
        )
    else:
        logger.error(f"Unhandled error: {exc}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"detail": str(exc)}
        )

# ============== MODELS ==============

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    role: str = "customer"
    created_at: datetime

class ProductCreate(BaseModel):
    name: str
    description: str
    price: float
    category: str
    images: List[str]
    stock: int = 0
    featured: bool = False

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None
    images: Optional[List[str]] = None
    stock: Optional[int] = None
    featured: Optional[bool] = None

class ProductResponse(BaseModel):
    product_id: str
    name: str
    description: str
    price: float
    category: str
    images: List[str]
    stock: int
    featured: bool
    created_at: datetime

class CartItemAdd(BaseModel):
    product_id: str
    quantity: int = 1

class CartItemResponse(BaseModel):
    product_id: str
    name: str
    price: float
    image: str
    quantity: int

class CartResponse(BaseModel):
    items: List[CartItemResponse]
    subtotal: float
    shipping: float
    total: float

class AddressInfo(BaseModel):
    full_name: str
    phone: str
    address_line1: str
    address_line2: Optional[str] = ""
    city: str
    state: str
    pincode: str

class OrderCreate(BaseModel):
    shipping_address: AddressInfo

class OrderResponse(BaseModel):
    order_id: str
    user_id: str
    items: List[CartItemResponse]
    subtotal: float
    shipping: float
    total: float
    status: str
    payment_status: str
    shipping_address: AddressInfo
    tracking_number: Optional[str] = None
    tracking_provider: Optional[str] = None
    created_at: datetime

class CheckoutRequest(BaseModel):
    order_id: str
    origin_url: str

class CategoryResponse(BaseModel):
    category_id: str
    name: str
    slug: str
    image: Optional[str] = None

class WishlistItemAdd(BaseModel):
    product_id: str

class WishlistItemResponse(BaseModel):
    product_id: str
    name: str
    price: float
    image: str
    stock: int
    added_at: str

# ============== AUTH HELPERS ==============

async def get_current_user(request: Request) -> Optional[dict]:
    """
    Extract and validate Supabase JWT token from Authorization header.
    Returns user dict from database or None if invalid.
    """
    auth_header = request.headers.get("Authorization")
    
    if not auth_header or not auth_header.startswith("Bearer "):
        logger.debug("No valid Authorization header found")
        return None
    
    token = auth_header.split(" ")[1]
    
    try:
        # Decode JWT without verification to get payload
        unverified_payload = jwt.decode(token, options={"verify_signature": False})
        
        email = unverified_payload.get('email')
        supabase_user_id = unverified_payload.get('sub')
        
        if not email or not supabase_user_id:
            logger.error(f"Token missing email or sub")
            return None
        
        logger.info(f"Token payload: email={email}, sub={supabase_user_id}")
        
        # Verify token with Supabase
        try:
            verify_response = requests.get(
                f"{SUPABASE_URL}/auth/v1/user",
                headers={
                    "Authorization": f"Bearer {token}",
                    "apikey": SUPABASE_ANON_KEY
                },
                timeout=5
            )
            
            if verify_response.status_code != 200:
                logger.error(f"Token verification failed: {verify_response.status_code}")
                return None
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Network error verifying token: {e}")
            return None
        
        # Get or create user in our database
        user_resp = supabase.table("users") \
            .select("*") \
            .eq("email", email) \
            .execute()
        
        user = user_resp.data[0] if user_resp.data else None
        
        # Create user if doesn't exist
        if not user:
            logger.info(f"Creating new user for email: {email}")
            
            user_metadata = unverified_payload.get('user_metadata', {})
            user_id = f"user_{uuid.uuid4().hex[:12]}"
            
            user_data = {
                "user_id": user_id,
                "email": email,
                "name": user_metadata.get("full_name") or user_metadata.get("name") or email.split("@")[0],
                "picture": user_metadata.get("avatar_url") or user_metadata.get("picture"),
                "role": "customer",
                "supabase_user_id": supabase_user_id,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            
            try:
                insert_resp = supabase.table("users").insert(user_data).execute()
                logger.info(f"User created: {user_id}")
                
                # Fetch newly created user
                user_resp = supabase.table("users") \
                    .select("*") \
                    .eq("user_id", user_id) \
                    .execute()
                
                user = user_resp.data[0] if user_resp.data else None
                
            except Exception as e:
                logger.error(f"Failed to create user: {e}")
                return None
        
        return user
        
    except jwt.DecodeError as e:
        logger.error(f"JWT decode error: {e}")
        return None
    except Exception as e:
        logger.error(f"Unexpected auth error: {type(e).__name__}: {e}")
        if not IS_PRODUCTION:
            import traceback
            logger.error(traceback.format_exc())
        return None

async def require_auth(request: Request) -> dict:
    """Require authentication, raise 401 if not authenticated"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user

async def require_admin(request: Request) -> dict:
    """Require admin role, raise 403 if not admin"""
    user = await require_auth(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# ============== AUTH ROUTES ==============

@api_router.get("/auth/me")
async def get_me(request: Request):
    """Get current authenticated user"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    return {
        "user_id": user["user_id"],
        "email": user["email"],
        "name": user["name"],
        "picture": user.get("picture"),
        "role": user.get("role", "customer")
    }

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    """Logout (handled by frontend)"""
    return {"message": "Logged out successfully"}

# ============== CATEGORIES ROUTES ==============

@api_router.get("/categories", response_model=List[CategoryResponse])
async def get_categories():
    """Get all categories"""
    resp = supabase.table("categories") \
        .select("*") \
        .execute()
    return resp.data or []

@api_router.post("/categories")
async def create_category(
    name: str,
    slug: str,
    image: Optional[str] = None,
    user: dict = Depends(require_admin)
):
    """Create a new category (admin only)"""
    category_id = f"cat_{uuid.uuid4().hex[:8]}"

    supabase.table("categories").insert({
        "category_id": category_id,
        "name": name,
        "slug": slug,
        "image": image
    }).execute()

    created = supabase.table("categories") \
        .select("*") \
        .eq("category_id", category_id) \
        .single() \
        .execute()

    return created.data

# ============== PRODUCTS ROUTES ==============

@api_router.get("/products")
async def get_products(
    category: Optional[str] = None,
    featured: Optional[bool] = None,
    search: Optional[str] = None,
    limit: int = 50,
    skip: int = 0
):
    """Get products with filters"""
    query = supabase.table("products").select("*", count="exact")

    if category:
        query = query.eq("category", category)

    if featured is not None:
        query = query.eq("featured", featured)

    if search:
        query = query.or_(
            f"name.ilike.%{search}%,description.ilike.%{search}%"
        )

    resp = query.range(skip, skip + limit - 1).execute()

    return {
        "products": resp.data or [],
        "total": resp.count or 0
    }

@api_router.get("/products/{product_id}")
async def get_product(product_id: str):
    """Get single product by ID"""
    resp = supabase.table("products") \
        .select("*") \
        .eq("product_id", product_id) \
        .single() \
        .execute()

    if not resp.data:
        raise HTTPException(status_code=404, detail="Product not found")

    return resp.data

@api_router.post("/products")
async def create_product(data: ProductCreate, user: dict = Depends(require_admin)):
    """Create new product (admin only)"""
    product_id = f"prod_{uuid.uuid4().hex[:8]}"

    supabase.table("products").insert({
        "product_id": product_id,
        "name": data.name,
        "description": data.description,
        "price": data.price,
        "category": data.category,
        "images": data.images,
        "stock": data.stock,
        "featured": data.featured,
        "created_at": datetime.now(timezone.utc).isoformat()
    }).execute()

    created = supabase.table("products") \
        .select("*") \
        .eq("product_id", product_id) \
        .single() \
        .execute()

    return created.data

@api_router.put("/products/{product_id}")
async def update_product(
    product_id: str,
    data: ProductUpdate,
    user: dict = Depends(require_admin)
):
    """Update product (admin only)"""
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}

    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")

    resp = supabase.table("products") \
        .update(update_data) \
        .eq("product_id", product_id) \
        .execute()

    if not resp.data:
        raise HTTPException(status_code=404, detail="Product not found")

    return resp.data[0]

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, user: dict = Depends(require_admin)):
    """Delete product (admin only)"""
    resp = supabase.table("products") \
        .delete() \
        .eq("product_id", product_id) \
        .execute()

    if not resp.data:
        raise HTTPException(status_code=404, detail="Product not found")

    return {"message": "Product deleted"}

# ============== CART ROUTES ==============

@api_router.get("/cart")
async def get_cart(user: dict = Depends(require_auth)):
    """Get user's cart"""
    try:
        # Get or create cart
        cart_resp = supabase.table("carts") \
            .select("id") \
            .eq("user_id", user["user_id"]) \
            .execute()

        if not cart_resp.data:
            # Create cart if doesn't exist
            cart_create = supabase.table("carts") \
                .insert({"user_id": user["user_id"]}) \
                .execute()
            
            if not cart_create.data:
                return {"items": [], "subtotal": 0, "shipping": 0, "total": 0}
            
            cart_id = cart_create.data[0]["id"]
        else:
            cart_id = cart_resp.data[0]["id"]

        # Get cart items
        items_resp = supabase.table("cart_items") \
            .select("product_id, quantity") \
            .eq("cart_id", cart_id) \
            .execute()

        items = []
        subtotal = 0

        for row in items_resp.data:
            product_resp = supabase.table("products") \
                .select("name, price, images") \
                .eq("product_id", row["product_id"]) \
                .execute()

            if not product_resp.data:
                continue

            product = product_resp.data[0]
            price = float(product["price"])
            quantity = row["quantity"]

            items.append({
                "product_id": row["product_id"],
                "name": product["name"],
                "price": price,
                "image": product["images"][0] if product["images"] else "",
                "quantity": quantity
            })

            subtotal += price * quantity

        shipping = SHIPPING_RATE if items else 0
        total = subtotal + shipping

        return {
            "items": items,
            "subtotal": subtotal,
            "shipping": shipping,
            "total": total
        }
    
    except Exception as e:
        logger.error(f"Get cart error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch cart")

@api_router.post("/cart/add")
async def add_to_cart(data: CartItemAdd, user: dict = Depends(require_auth)):
    """Add item to cart"""
    try:
        # Validate product exists and has stock
        product_resp = supabase.table("products") \
            .select("stock, name") \
            .eq("product_id", data.product_id) \
            .execute()

        if not product_resp.data:
            raise HTTPException(status_code=404, detail="Product not found")

        product = product_resp.data[0]
        
        if product["stock"] < data.quantity:
            raise HTTPException(status_code=400, detail="Insufficient stock")

        # Get or create cart
        cart_resp = supabase.table("carts") \
            .select("id") \
            .eq("user_id", user["user_id"]) \
            .execute()

        if not cart_resp.data:
            cart_create = supabase.table("carts") \
                .insert({"user_id": user["user_id"]}) \
                .execute()
            cart_id = cart_create.data[0]["id"]
        else:
            cart_id = cart_resp.data[0]["id"]

        # Check if item already in cart
        existing_resp = supabase.table("cart_items") \
            .select("id, quantity") \
            .eq("cart_id", cart_id) \
            .eq("product_id", data.product_id) \
            .execute()

        if existing_resp.data:
            # Update quantity
            existing = existing_resp.data[0]
            new_qty = existing["quantity"] + data.quantity
            
            if new_qty > product["stock"]:
                raise HTTPException(status_code=400, detail="Stock limit exceeded")

            supabase.table("cart_items") \
                .update({"quantity": new_qty}) \
                .eq("id", existing["id"]) \
                .execute()
        else:
            # Insert new item
            supabase.table("cart_items").insert({
                "cart_id": cart_id,
                "product_id": data.product_id,
                "quantity": data.quantity
            }).execute()

        logger.info(f"Added to cart: {product['name']} x {data.quantity}")
        return {"message": "Added to cart successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Add to cart error: {e}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail="Failed to add to cart")

@api_router.put("/cart/update")
async def update_cart_item(data: CartItemAdd, user: dict = Depends(require_auth)):
    """Update cart item quantity"""
    cart_resp = supabase.table("carts") \
        .select("id") \
        .eq("user_id", user["user_id"]) \
        .execute()

    if not cart_resp.data:
        raise HTTPException(status_code=404, detail="Cart not found")

    cart_id = cart_resp.data[0]["id"]

    if data.quantity <= 0:
        # Remove item
        supabase.table("cart_items") \
            .delete() \
            .eq("cart_id", cart_id) \
            .eq("product_id", data.product_id) \
            .execute()
    else:
        # Update quantity
        supabase.table("cart_items") \
            .update({"quantity": data.quantity}) \
            .eq("cart_id", cart_id) \
            .eq("product_id", data.product_id) \
            .execute()

    return {"message": "Cart updated"}

@api_router.delete("/cart/clear")
async def clear_cart(user: dict = Depends(require_auth)):
    """Clear all items from cart"""
    cart_resp = supabase.table("carts") \
        .select("id") \
        .eq("user_id", user["user_id"]) \
        .execute()

    if cart_resp.data:
        supabase.table("cart_items") \
            .delete() \
            .eq("cart_id", cart_resp.data[0]["id"]) \
            .execute()

    return {"message": "Cart cleared"}

# ============== WISHLIST ROUTES ==============

@api_router.get("/wishlist")
async def get_wishlist(user: dict = Depends(require_auth)):
    """Get user's wishlist"""
    try:
        logger.info(f"Fetching wishlist for user: {user['user_id']}")
        
        # Get or create wishlist
        wishlist_resp = supabase.table("wishlists") \
            .select("id") \
            .eq("user_id", user["user_id"]) \
            .execute()

        if not wishlist_resp.data:
            logger.info("No wishlist found, creating one")
            # Create wishlist
            wishlist_create = supabase.table("wishlists") \
                .insert({"user_id": user["user_id"]}) \
                .execute()
            
            if not wishlist_create.data:
                logger.error("Failed to create wishlist")
                return {"items": []}
            
            wishlist_id = wishlist_create.data[0]["id"]
            logger.info(f"Created wishlist with id: {wishlist_id}")
        else:
            wishlist_id = wishlist_resp.data[0]["id"]
            logger.info(f"Found existing wishlist with id: {wishlist_id}")

        # Get wishlist items
        items_resp = supabase.table("wishlist_items") \
            .select("product_id, added_at") \
            .eq("wishlist_id", wishlist_id) \
            .execute()

        logger.info(f"Found {len(items_resp.data)} wishlist items")

        items = []
        for row in items_resp.data:
            # Fetch product details
            product_resp = supabase.table("products") \
                .select("product_id, name, price, images, stock") \
                .eq("product_id", row["product_id"]) \
                .execute()

            if product_resp.data:
                product = product_resp.data[0]
                items.append({
                    "product_id": row["product_id"],
                    "name": product["name"],
                    "price": float(product["price"]),
                    "image": product["images"][0] if product["images"] else "",
                    "stock": product["stock"],
                    "added_at": row["added_at"]
                })
                logger.info(f"Added product to wishlist response: {product['name']}")
            else:
                logger.warning(f"Product not found: {row['product_id']}")

        logger.info(f"Returning {len(items)} items in wishlist")
        return {"items": items}
    
    except Exception as e:
        logger.error(f"Get wishlist error: {e}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to fetch wishlist: {str(e)}")


@api_router.post("/wishlist/add")
async def add_to_wishlist(data: WishlistItemAdd, user: dict = Depends(require_auth)):
    """Add item to wishlist"""
    try:
        logger.info(f"Adding product {data.product_id} to wishlist for user {user['user_id']}")
        
        # Validate product exists
        product_resp = supabase.table("products") \
            .select("product_id, name") \
            .eq("product_id", data.product_id) \
            .execute()

        if not product_resp.data:
            logger.error(f"Product not found: {data.product_id}")
            raise HTTPException(status_code=404, detail="Product not found")

        product_name = product_resp.data[0]["name"]
        logger.info(f"Found product: {product_name}")

        # Get or create wishlist
        wishlist_resp = supabase.table("wishlists") \
            .select("id") \
            .eq("user_id", user["user_id"]) \
            .execute()

        if not wishlist_resp.data:
            logger.info("Creating new wishlist")
            wishlist_create = supabase.table("wishlists") \
                .insert({"user_id": user["user_id"]}) \
                .execute()
            
            if not wishlist_create.data:
                logger.error("Failed to create wishlist")
                raise HTTPException(status_code=500, detail="Failed to create wishlist")
            
            wishlist_id = wishlist_create.data[0]["id"]
            logger.info(f"Created wishlist: {wishlist_id}")
        else:
            wishlist_id = wishlist_resp.data[0]["id"]
            logger.info(f"Using existing wishlist: {wishlist_id}")

        # Check if already in wishlist
        exists_resp = supabase.table("wishlist_items") \
            .select("id") \
            .eq("wishlist_id", wishlist_id) \
            .eq("product_id", data.product_id) \
            .execute()

        if exists_resp.data:
            logger.info("Product already in wishlist")
            return {"message": "Already in wishlist"}

        # Add to wishlist
        insert_resp = supabase.table("wishlist_items").insert({
            "wishlist_id": wishlist_id,
            "product_id": data.product_id
        }).execute()

        logger.info(f"Successfully added {product_name} to wishlist")
        return {"message": "Added to wishlist successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Add to wishlist error: {e}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to add to wishlist: {str(e)}")


@api_router.delete("/wishlist/{product_id}")
async def remove_from_wishlist(product_id: str, user: dict = Depends(require_auth)):
    """Remove item from wishlist"""
    try:
        logger.info(f"Removing {product_id} from wishlist for user {user['user_id']}")
        
        wishlist_resp = supabase.table("wishlists") \
            .select("id") \
            .eq("user_id", user["user_id"]) \
            .execute()

        if wishlist_resp.data:
            delete_resp = supabase.table("wishlist_items") \
                .delete() \
                .eq("wishlist_id", wishlist_resp.data[0]["id"]) \
                .eq("product_id", product_id) \
                .execute()
            
            logger.info(f"Removed {product_id} from wishlist")
        else:
            logger.warning("Wishlist not found")

        return {"message": "Removed from wishlist"}
    
    except Exception as e:
        logger.error(f"Remove from wishlist error: {e}")
        raise HTTPException(status_code=500, detail="Failed to remove from wishlist")


@api_router.post("/wishlist/{product_id}/move-to-cart")
async def wishlist_to_cart(product_id: str, user: dict = Depends(require_auth)):
    """Move item from wishlist to cart"""
    try:
        logger.info(f"Moving {product_id} from wishlist to cart")
        
        # Add to cart
        await add_to_cart(CartItemAdd(product_id=product_id, quantity=1), user)

        # Remove from wishlist
        wishlist_resp = supabase.table("wishlists") \
            .select("id") \
            .eq("user_id", user["user_id"]) \
            .execute()

        if wishlist_resp.data:
            supabase.table("wishlist_items") \
                .delete() \
                .eq("wishlist_id", wishlist_resp.data[0]["id"]) \
                .eq("product_id", product_id) \
                .execute()
            
            logger.info("Moved to cart successfully")

        return {"message": "Moved to cart"}
    
    except Exception as e:
        logger.error(f"Move to cart error: {e}")
        raise HTTPException(status_code=500, detail="Failed to move to cart")


@api_router.get("/wishlist/check/{product_id}")
async def check_wishlist(product_id: str, user: dict = Depends(require_auth)):
    """Check if product is in wishlist"""
    try:
        wishlist_resp = supabase.table("wishlists") \
            .select("id") \
            .eq("user_id", user["user_id"]) \
            .execute()

        if not wishlist_resp.data:
            return {"in_wishlist": False}

        exists_resp = supabase.table("wishlist_items") \
            .select("id") \
            .eq("wishlist_id", wishlist_resp.data[0]["id"]) \
            .eq("product_id", product_id) \
            .execute()

        result = bool(exists_resp.data)
        logger.info(f"Product {product_id} in wishlist: {result}")
        return {"in_wishlist": result}
    
    except Exception as e:
        logger.error(f"Check wishlist error: {e}")
        return {"in_wishlist": False}


@api_router.get("/wishlist/count")
async def wishlist_count(user: dict = Depends(require_auth)):
    """Get wishlist item count"""
    try:
        wishlist_resp = supabase.table("wishlists") \
            .select("id") \
            .eq("user_id", user["user_id"]) \
            .execute()

        if not wishlist_resp.data:
            return {"count": 0}

        count_resp = supabase.table("wishlist_items") \
            .select("id", count="exact") \
            .eq("wishlist_id", wishlist_resp.data[0]["id"]) \
            .execute()

        count = count_resp.count or 0
        logger.info(f"Wishlist count for user {user['user_id']}: {count}")
        return {"count": count}
    
    except Exception as e:
        logger.error(f"Wishlist count error: {e}")
        return {"count": 0}


@api_router.post("/cart/{product_id}/move-to-wishlist")
async def cart_to_wishlist(product_id: str, user: dict = Depends(require_auth)):
    """Move item from cart to wishlist"""
    try:
        logger.info(f"Moving {product_id} from cart to wishlist")
        
        # Add to wishlist
        await add_to_wishlist(WishlistItemAdd(product_id=product_id), user)

        # Remove from cart
        cart_resp = supabase.table("carts") \
            .select("id") \
            .eq("user_id", user["user_id"]) \
            .execute()

        if cart_resp.data:
            supabase.table("cart_items") \
                .delete() \
                .eq("cart_id", cart_resp.data[0]["id"]) \
                .eq("product_id", product_id) \
                .execute()
            
            logger.info("Moved to wishlist successfully")

        return {"message": "Moved to wishlist"}
    
    except Exception as e:
        logger.error(f"Move to wishlist error: {e}")
        raise HTTPException(status_code=500, detail="Failed to move to wishlist")
    
# ============== ORDER ROUTES ==============

@api_router.post("/orders")
async def create_order(data: OrderCreate, user: dict = Depends(require_auth)):
    """Create order from cart"""
    # Get cart
    cart_resp = supabase.table("carts") \
        .select("id") \
        .eq("user_id", user["user_id"]) \
        .execute()

    if not cart_resp.data:
        raise HTTPException(status_code=400, detail="Cart is empty")

    cart_id = cart_resp.data[0]["id"]

    cart_items = supabase.table("cart_items") \
        .select("product_id, quantity") \
        .eq("cart_id", cart_id) \
        .execute()

    if not cart_items.data:
        raise HTTPException(status_code=400, detail="Cart is empty")

    items = []
    subtotal = 0

    # Validate stock
    for item in cart_items.data:
        product_resp = supabase.table("products") \
            .select("name, price, images, stock") \
            .eq("product_id", item["product_id"]) \
            .execute()

        if not product_resp.data:
            raise HTTPException(status_code=404, detail="Product not found")

        product = product_resp.data[0]

        if product["stock"] < item["quantity"]:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for {product['name']}"
            )

        subtotal += float(product["price"]) * item["quantity"]

        items.append({
            "product_id": item["product_id"],
            "name": product["name"],
            "price": float(product["price"]),
            "image": product["images"][0] if product["images"] else "",
            "quantity": item["quantity"]
        })

    shipping = SHIPPING_RATE
    total = subtotal + shipping

    order_id = f"order_{uuid.uuid4().hex[:10]}"

    # Create order
    supabase.table("orders").insert({
        "order_id": order_id,
        "user_id": user["user_id"],
        "subtotal": subtotal,
        "shipping": shipping,
        "total": total,
        "status": "pending",
        "payment_status": "pending",
        "shipping_address": data.shipping_address.model_dump()
    }).execute()

    # Insert order items + reduce stock
    for item in items:
        supabase.table("order_items").insert({
            "order_id": order_id,
            **item
        }).execute()

        # Get current stock
        product_resp = supabase.table("products") \
            .select("stock") \
            .eq("product_id", item["product_id"]) \
            .execute()
        
        current_stock = product_resp.data[0]["stock"]

        supabase.table("products") \
            .update({"stock": current_stock - item["quantity"]}) \
            .eq("product_id", item["product_id"]) \
            .execute()

    # Clear cart
    supabase.table("cart_items") \
        .delete() \
        .eq("cart_id", cart_id) \
        .execute()

    return {"order_id": order_id, "total": total}

@api_router.get("/orders")
async def get_user_orders(user: dict = Depends(require_auth)):
    """Get user's orders"""
    orders = supabase.table("orders") \
        .select("*") \
        .eq("user_id", user["user_id"]) \
        .order("created_at", desc=True) \
        .execute()

    return orders.data or []

@api_router.get("/orders/{order_id}")
async def get_order(order_id: str, user: dict = Depends(require_auth)):
    """Get order details"""
    order_resp = supabase.table("orders") \
        .select("*") \
        .eq("order_id", order_id) \
        .execute()

    if not order_resp.data:
        raise HTTPException(status_code=404, detail="Order not found")

    order = order_resp.data[0]

    if order["user_id"] != user["user_id"] and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Access denied")

    items = supabase.table("order_items") \
        .select("product_id, name, price, image, quantity") \
        .eq("order_id", order_id) \
        .execute()

    return {
        **order,
        "items": items.data or []
    }

# ============== STRIPE CHECKOUT ROUTES ==============

@api_router.post("/checkout/create-session")
async def create_checkout_session(
    data: CheckoutRequest,
    user: dict = Depends(require_auth)
):
    raise HTTPException(
        status_code=501,
        detail="Online payments are temporarily disabled"
    )

@api_router.get("/checkout/status/{session_id}")
async def get_checkout_status(session_id: str):
    raise HTTPException(
        status_code=501,
        detail="Payments are disabled"
    )

@api_router.post("/webhook/stripe")
async def stripe_webhook():
    return {"status": "ignored"}

# ============== ADMIN ROUTES ==============

@api_router.get("/admin/orders")
async def get_all_orders(
    status: Optional[str] = None,
    user: dict = Depends(require_admin)
):
    """
    Get all orders (admin only)
    Supports filtering by status via query param: ?status=pending
    """
    query = supabase.table("orders").select("*").order("created_at", desc=True)

    if status:
        query = query.eq("status", status)

    orders_resp = query.execute()
    orders = orders_resp.data or []

    # Fetch items for each order
    for order in orders:
        items_resp = supabase.table("order_items") \
            .select("product_id, name, price, image, quantity") \
            .eq("order_id", order["order_id"]) \
            .execute()
        
        order["items"] = items_resp.data or []

    return orders

@api_router.put("/admin/orders/{order_id}")
async def update_order_status(
    order_id: str,
    status: Optional[str] = None,
    tracking_number: Optional[str] = None,
    tracking_provider: Optional[str] = None,
    user: dict = Depends(require_admin)
):
    """
    Update order status and/or tracking (admin only)
    Supports query params: ?status=shipped&tracking_number=ABC123&tracking_provider=delhivery
    """
    update_data = {}

    if status:
        update_data["status"] = status
    if tracking_number:
        update_data["tracking_number"] = tracking_number
    if tracking_provider:
        update_data["tracking_provider"] = tracking_provider

    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")

    resp = supabase.table("orders") \
        .update(update_data) \
        .eq("order_id", order_id) \
        .execute()

    if not resp.data:
        raise HTTPException(status_code=404, detail="Order not found")

    return resp.data[0]

@api_router.get("/admin/stats")
async def get_admin_stats(user: dict = Depends(require_admin)):
    """Get admin dashboard stats"""
    total_orders = supabase.table("orders") \
        .select("id", count="exact") \
        .execute().count or 0

    pending_orders = supabase.table("orders") \
        .select("id", count="exact") \
        .eq("status", "pending") \
        .execute().count or 0

    confirmed_orders = supabase.table("orders") \
        .select("id", count="exact") \
        .eq("status", "confirmed") \
        .execute().count or 0

    shipped_orders = supabase.table("orders") \
        .select("id", count="exact") \
        .eq("status", "shipped") \
        .execute().count or 0

    delivered_orders = supabase.table("orders") \
        .select("id", count="exact") \
        .eq("status", "delivered") \
        .execute().count or 0

    total_products = supabase.table("products") \
        .select("id", count="exact") \
        .execute().count or 0

    total_users = supabase.table("users") \
        .select("user_id", count="exact") \
        .execute().count or 0

    revenue_resp = supabase.table("orders") \
        .select("total") \
        .eq("payment_status", "paid") \
        .execute()

    total_revenue = sum(float(o["total"]) for o in revenue_resp.data) if revenue_resp.data else 0

    return {
        "total_orders": total_orders,
        "pending_orders": pending_orders,
        "confirmed_orders": confirmed_orders,
        "shipped_orders": shipped_orders,
        "delivered_orders": delivered_orders,
        "total_products": total_products,
        "total_users": total_users,
        "total_revenue": total_revenue
    }

# ============== TRACKING ROUTES ==============

@api_router.get("/tracking/{order_id}")
async def get_tracking_info(order_id: str):
    """Get order tracking info"""
    order = supabase.table("orders") \
        .select(
            "order_id, status, tracking_number, tracking_provider"
        ) \
        .eq("order_id", order_id) \
        .execute()

    if not order.data:
        raise HTTPException(status_code=404, detail="Order not found")

    tracking_info = {
        "order_id": order.data[0]["order_id"],
        "status": order.data[0]["status"],
        "tracking_number": order.data[0].get("tracking_number"),
        "tracking_provider": order.data[0].get("tracking_provider"),
        "tracking_url": None
    }

    if tracking_info["tracking_number"] and tracking_info["tracking_provider"]:
        provider = tracking_info["tracking_provider"].lower()
        tracking_number = tracking_info["tracking_number"]

        if provider == "delhivery":
            tracking_info["tracking_url"] = (
                f"https://www.delhivery.com/track/package/{tracking_number}"
            )
        elif provider == "bluedart":
            tracking_info["tracking_url"] = (
                f"https://www.bluedart.com/tracking/{tracking_number}"
            )

    return tracking_info

# ============== SEED DATA ROUTE ==============

@api_router.post("/seed")
async def seed_data():
    """Seed initial data (dev only)"""
    # Check if products already exist
    existing = supabase.table("products") \
        .select("product_id") \
        .limit(1) \
        .execute()

    if existing.data:
        return {"message": "Data already seeded"}

    # Categories
    categories = [
        {
            "category_id": "cat_tech",
            "name": "Technology",
            "slug": "tech",
            "image": "https://images.unsplash.com/photo-1560718217-69193acc0713"
        },
        {
            "category_id": "cat_home",
            "name": "Home & Living",
            "slug": "home",
            "image": "https://images.unsplash.com/photo-1765277114329-b3da8e70731e"
        },
        {
            "category_id": "cat_fashion",
            "name": "Fashion",
            "slug": "fashion",
            "image": "https://images.unsplash.com/photo-1483985988355-763728e1935b"
        }
    ]

    supabase.table("categories").insert(categories).execute()

    # Products
    products = [
        {
            "product_id": "prod_headphones",
            "name": "Sonic Pro X Headphones",
            "description": "Premium wireless headphones with ANC and spatial audio.",
            "price": 24999,
            "category": "tech",
            "images": [
                "https://images.unsplash.com/photo-1560718217-69193acc0713"
            ],
            "stock": 50,
            "featured": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "product_id": "prod_watch",
            "name": "Horizon Smart Watch",
            "description": "Advanced smartwatch with GPS and health tracking.",
            "price": 33199,
            "category": "tech",
            "images": [
                "https://images.unsplash.com/photo-1733908511568-3abc819b21b5"
            ],
            "stock": 30,
            "featured": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "product_id": "prod_lamp",
            "name": "Minimal Desk Lamp",
            "description": "LED desk lamp with touch controls.",
            "price": 4999,
            "category": "home",
            "images": [
                "https://images.unsplash.com/photo-1507473885765-e6ed057f782c"
            ],
            "stock": 75,
            "featured": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]

    supabase.table("products").insert(products).execute()

    return {"message": "Seed data inserted successfully"}

# ============== APP SETUP ==============

app.include_router(api_router)

# Health check
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "environment": "production" if IS_PRODUCTION else "development"
    }

# Root endpoint
@app.get("/")
async def root():
    if IS_PRODUCTION:
        return {"message": "E-Commerce API is running"}
    else:
        return {
            "message": "E-Commerce API is running",
            "docs": "/docs",
            "health": "/health"
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)