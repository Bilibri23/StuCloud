# 🛠️ Backend Implementation Guide

**Goal**: Connect the static frontend modules to working backend APIs

---

## 🎯 Quick Start: Housing Marketplace (MVP)

Let's make the Housing Marketplace fully functional first.

### **Step 1: Create the Entity**

Create: `src/main/java/org/distributed/stumatchdistributed/housing/model/HousingListing.java`

```java
package org.distributed.stumatchdistributed.housing.model;

import jakarta.persistence.*;
import lombok.Data;
import org.distributed.stumatchdistributed.auth.model.UserAccount;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "housing_listings")
@Data
public class HousingListing {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(length = 2000)
    private String description;

    @Column(nullable = false)
    private BigDecimal price;

    @Column(nullable = false)
    private String location;

    private Double latitude;
    private Double longitude;

    @Column(nullable = false)
    private Integer bedrooms;

    private Integer bathrooms;

    @Column(nullable = false)
    private Boolean verified = false;

    private String imageUrl;

    @ManyToOne
    @JoinColumn(name = "landlord_id", nullable = false)
    private UserAccount landlord;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime updatedAt;

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
```

### **Step 2: Create the Repository**

Create: `src/main/java/org/distributed/stumatchdistributed/housing/repository/HousingListingRepository.java`

```java
package org.distributed.stumatchdistributed.housing.repository;

import org.distributed.stumatchdistributed.housing.model.HousingListing;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.util.List;

@Repository
public interface HousingListingRepository extends JpaRepository<HousingListing, Long> {
    
    List<HousingListing> findByVerifiedTrue();
    
    List<HousingListing> findByPriceBetween(BigDecimal minPrice, BigDecimal maxPrice);
    
    List<HousingListing> findByBedrooms(Integer bedrooms);
    
    List<HousingListing> findByLocationContainingIgnoreCase(String location);
    
    @Query("SELECT h FROM HousingListing h WHERE " +
           "(:minPrice IS NULL OR h.price >= :minPrice) AND " +
           "(:maxPrice IS NULL OR h.price <= :maxPrice) AND " +
           "(:bedrooms IS NULL OR h.bedrooms = :bedrooms) AND " +
           "(:location IS NULL OR LOWER(h.location) LIKE LOWER(CONCAT('%', :location, '%')))")
    List<HousingListing> searchListings(
        BigDecimal minPrice, 
        BigDecimal maxPrice, 
        Integer bedrooms, 
        String location
    );
}
```

### **Step 3: Create the Service**

Create: `src/main/java/org/distributed/stumatchdistributed/housing/service/HousingService.java`

```java
package org.distributed.stumatchdistributed.housing.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.distributed.stumatchdistributed.auth.model.UserAccount;
import org.distributed.stumatchdistributed.housing.model.HousingListing;
import org.distributed.stumatchdistributed.housing.repository.HousingListingRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class HousingService {
    
    private final HousingListingRepository housingListingRepository;

    public List<HousingListing> getAllListings() {
        log.info("Fetching all housing listings");
        return housingListingRepository.findAll();
    }

    public List<HousingListing> getVerifiedListings() {
        log.info("Fetching verified housing listings");
        return housingListingRepository.findByVerifiedTrue();
    }

    public HousingListing getListingById(Long id) {
        log.info("Fetching listing with id: {}", id);
        return housingListingRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Listing not found with id: " + id));
    }

    @Transactional
    public HousingListing createListing(HousingListing listing, UserAccount landlord) {
        log.info("Creating new listing: {} by user: {}", listing.getTitle(), landlord.getEmail());
        listing.setLandlord(landlord);
        listing.setVerified(false); // New listings need verification
        return housingListingRepository.save(listing);
    }

    @Transactional
    public HousingListing updateListing(Long id, HousingListing updatedListing, UserAccount user) {
        log.info("Updating listing with id: {}", id);
        HousingListing existing = getListingById(id);
        
        // Check if user owns this listing
        if (!existing.getLandlord().getId().equals(user.getId())) {
            throw new RuntimeException("You can only update your own listings");
        }

        existing.setTitle(updatedListing.getTitle());
        existing.setDescription(updatedListing.getDescription());
        existing.setPrice(updatedListing.getPrice());
        existing.setLocation(updatedListing.getLocation());
        existing.setBedrooms(updatedListing.getBedrooms());
        existing.setBathrooms(updatedListing.getBathrooms());
        existing.setImageUrl(updatedListing.getImageUrl());

        return housingListingRepository.save(existing);
    }

    @Transactional
    public void deleteListing(Long id, UserAccount user) {
        log.info("Deleting listing with id: {}", id);
        HousingListing listing = getListingById(id);
        
        // Check if user owns this listing
        if (!listing.getLandlord().getId().equals(user.getId())) {
            throw new RuntimeException("You can only delete your own listings");
        }

        housingListingRepository.delete(listing);
    }

    public List<HousingListing> searchListings(BigDecimal minPrice, BigDecimal maxPrice, 
                                                Integer bedrooms, String location) {
        log.info("Searching listings with filters - minPrice: {}, maxPrice: {}, bedrooms: {}, location: {}", 
                 minPrice, maxPrice, bedrooms, location);
        return housingListingRepository.searchListings(minPrice, maxPrice, bedrooms, location);
    }

    public long countAvailableListings() {
        return housingListingRepository.count();
    }
}
```

### **Step 4: Create the Controller**

Create: `src/main/java/org/distributed/stumatchdistributed/housing/controller/HousingController.java`

```java
package org.distributed.stumatchdistributed.housing.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.distributed.stumatchdistributed.auth.model.UserAccount;
import org.distributed.stumatchdistributed.auth.service.UserService;
import org.distributed.stumatchdistributed.housing.model.HousingListing;
import org.distributed.stumatchdistributed.housing.service.HousingService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/housing")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class HousingController {

    private final HousingService housingService;
    private final UserService userService;

    @GetMapping("/listings")
    public ResponseEntity<List<HousingListing>> getAllListings() {
        log.info("API request: GET /api/housing/listings");
        List<HousingListing> listings = housingService.getAllListings();
        return ResponseEntity.ok(listings);
    }

    @GetMapping("/listings/verified")
    public ResponseEntity<List<HousingListing>> getVerifiedListings() {
        log.info("API request: GET /api/housing/listings/verified");
        List<HousingListing> listings = housingService.getVerifiedListings();
        return ResponseEntity.ok(listings);
    }

    @GetMapping("/listings/{id}")
    public ResponseEntity<HousingListing> getListingById(@PathVariable Long id) {
        log.info("API request: GET /api/housing/listings/{}", id);
        HousingListing listing = housingService.getListingById(id);
        return ResponseEntity.ok(listing);
    }

    @PostMapping("/listings")
    public ResponseEntity<?> createListing(
            @RequestBody HousingListing listing,
            Authentication authentication) {
        try {
            log.info("API request: POST /api/housing/listings");
            UserAccount user = userService.getUserByEmail(authentication.getName());
            HousingListing created = housingService.createListing(listing, user);
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            log.error("Failed to create listing", e);
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/listings/{id}")
    public ResponseEntity<?> updateListing(
            @PathVariable Long id,
            @RequestBody HousingListing listing,
            Authentication authentication) {
        try {
            log.info("API request: PUT /api/housing/listings/{}", id);
            UserAccount user = userService.getUserByEmail(authentication.getName());
            HousingListing updated = housingService.updateListing(id, listing, user);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            log.error("Failed to update listing", e);
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/listings/{id}")
    public ResponseEntity<?> deleteListing(
            @PathVariable Long id,
            Authentication authentication) {
        try {
            log.info("API request: DELETE /api/housing/listings/{}", id);
            UserAccount user = userService.getUserByEmail(authentication.getName());
            housingService.deleteListing(id, user);
            return ResponseEntity.ok(Map.of("message", "Listing deleted successfully"));
        } catch (Exception e) {
            log.error("Failed to delete listing", e);
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/search")
    public ResponseEntity<List<HousingListing>> searchListings(
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) Integer bedrooms,
            @RequestParam(required = false) String location) {
        log.info("API request: GET /api/housing/search");
        List<HousingListing> listings = housingService.searchListings(
                minPrice, maxPrice, bedrooms, location);
        return ResponseEntity.ok(listings);
    }
}
```

### **Step 5: Update Frontend to Use Real API**

Update: `frontend/stumatch/src/components/Housing/HousingMarketplace.jsx`

```javascript
// Add at the top
const API_BASE = 'http://localhost:8081/api';

// Add state for token
const token = localStorage.getItem('token');

// Replace mock data with API call
useEffect(() => {
    fetchListings();
}, []);

const fetchListings = async () => {
    try {
        const response = await fetch(`${API_BASE}/housing/listings`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (response.ok) {
            const data = await response.json();
            setListings(data);
        }
    } catch (err) {
        console.error('Failed to fetch listings:', err);
    }
};

// Add search function
const handleSearch = async () => {
    try {
        const params = new URLSearchParams();
        if (minPrice) params.append('minPrice', minPrice);
        if (maxPrice) params.append('maxPrice', maxPrice);
        if (bedrooms !== 'any') params.append('bedrooms', bedrooms);
        if (location) params.append('location', location);

        const response = await fetch(`${API_BASE}/housing/search?${params}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (response.ok) {
            const data = await response.json();
            setListings(data);
        }
    } catch (err) {
        console.error('Search failed:', err);
    }
};
```

### **Step 6: Add Sample Data (For Testing)**

Create a data initialization script or add via Postman:

```sql
INSERT INTO housing_listings (title, description, price, location, bedrooms, bathrooms, verified, landlord_id, created_at)
VALUES 
('2-Bedroom Apartment', 'Spacious apartment with modern amenities', 120.00, 'Near ICT Campus', 2, 1, true, 1, NOW()),
('Studio Apartment', 'Cozy studio perfect for students', 80.00, 'Downtown', 1, 1, true, 1, NOW()),
('3-Bedroom House', 'Spacious house ideal for sharing', 150.00, 'Residential Area', 3, 2, false, 1, NOW()),
('Shared Room', 'Affordable shared accommodation', 45.00, 'Campus Housing', 1, 1, true, 1, NOW());
```

---

## 🧪 Testing the Integration

### **1. Start the Backend**
```bash
./mvnw spring-boot:run
```

### **2. Test with Postman**

**Get All Listings:**
```
GET http://localhost:8081/api/housing/listings
Authorization: Bearer YOUR_JWT_TOKEN
```

**Create Listing:**
```
POST http://localhost:8081/api/housing/listings
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
    "title": "Test Apartment",
    "description": "A test listing",
    "price": 100,
    "location": "Test Location",
    "bedrooms": 2,
    "bathrooms": 1
}
```

**Search Listings:**
```
GET http://localhost:8081/api/housing/search?minPrice=50&maxPrice=150&bedrooms=2
Authorization: Bearer YOUR_JWT_TOKEN
```

### **3. Test in Frontend**
1. Login to the app
2. Navigate to "Housing Market"
3. You should see real listings from the database
4. Search should filter results

---

## 📦 Complete Package Structure

After implementation, you'll have:

```
src/main/java/org/distributed/stumatchdistributed/
├── housing/
│   ├── model/
│   │   └── HousingListing.java ✨
│   ├── repository/
│   │   └── HousingListingRepository.java ✨
│   ├── service/
│   │   └── HousingService.java ✨
│   └── controller/
│       └── HousingController.java ✨
├── auth/ (existing)
├── storage/ (existing)
└── network/ (existing)
```

---

## 🎯 Next Steps

After Housing Marketplace works:

1. **Roommate Matching** - Follow same pattern
2. **My Housing/Groups** - Add group functionality
3. **Bill Splitting** - Financial calculations
4. **Dashboard Stats** - Real-time aggregation

---

## 💡 Tips

1. **Test incrementally** - One endpoint at a time
2. **Use Postman** - Test APIs before frontend
3. **Check logs** - Backend console shows all requests
4. **Database** - Use H2 console to verify data
5. **CORS** - Already configured with `@CrossOrigin`

---

**You're ready to make Housing Marketplace fully functional!** 🚀
