# 📝 App Name Change Checklist

**If you decide to change from "Balanze" to a new name**

---

## 🎯 Step 1: Choose New Name

### Quick Name Suggestions:
- **Balanze Finance** (adds category)
- **Balanze Money** (clearer purpose)
- **Balanze Budget** (specific feature)
- **FinBalanze** (finance + balance)
- **BalanzeApp** (adds "App")
- **MyBalanze** (personal touch)
- **Balanz** (without 'e')
- **Balanzee** (different spelling)

### Verify New Name:
- [ ] Quick Google search: `"[New Name]" app`
- [ ] Quick USPTO search: https://www.uspto.gov/trademarks/search
- [ ] Check Google Play: Search for existing apps
- [ ] Domain availability: Check if domain is available

---

## 🔧 Step 2: Update Code

### Files to Update:

#### Package/Bundle ID (Android)
- [ ] `android/app/build.gradle` - Update `applicationId`
- [ ] `android/app/src/main/AndroidManifest.xml` - Update package references
- [ ] Update any hardcoded package references

#### App Name Display
- [ ] `android/app/src/main/res/values/strings.xml` - Update `app_name`
- [ ] `src/pages/LandingPage.tsx` - Update all "Balanze" references
- [ ] `index.html` - Update title and meta tags
- [ ] `public/manifest.json` - Update name and short_name

#### Branding
- [ ] Search codebase for "Balanze" (case-insensitive)
- [ ] Update all user-facing text
- [ ] Update error messages
- [ ] Update help text

---

## 📱 Step 3: Update Store Listing

### Google Play Console (When Accessible):
- [ ] App name in Play Console
- [ ] Short description
- [ ] Full description (`google_play_full_description.txt`)
- [ ] Screenshots (if name appears)
- [ ] Feature graphic (if name appears)

### App Store (If Applicable):
- [ ] App name
- [ ] Description
- [ ] Keywords

---

## 🌐 Step 4: Update Website/Documentation

### Website:
- [ ] Domain name (if changing)
- [ ] All page titles
- [ ] Meta descriptions
- [ ] Footer text
- [ ] About page
- [ ] Privacy Policy
- [ ] Terms of Service

### Documentation:
- [ ] README.md
- [ ] All .md files
- [ ] API documentation
- [ ] User guides

---

## 📧 Step 5: Update Legal Documents

### Privacy Policy:
- [ ] Update app name references
- [ ] Update contact information (if needed)
- [ ] Update "Last Updated" date

### Terms of Service:
- [ ] Update app name references
- [ ] Update "Last Updated" date

### Refund Policy:
- [ ] Update app name references

---

## 🔍 Step 6: Search & Replace

### Global Search for "Balanze":
```bash
# Search all files (case-insensitive)
grep -r -i "balanze" --exclude-dir=node_modules --exclude-dir=.git
```

### Files to Check:
- [ ] All `.tsx` files
- [ ] All `.ts` files
- [ ] All `.md` files
- [ ] All `.json` files
- [ ] All `.html` files
- [ ] Configuration files

---

## ✅ Step 7: Verification

### Before Submitting:
- [ ] Test app with new name
- [ ] Verify all references updated
- [ ] Check for typos
- [ ] Test on different devices
- [ ] Verify branding consistency

### After Changes:
- [ ] Build and test app
- [ ] Verify no broken references
- [ ] Check console for errors
- [ ] Test all features still work

---

## 📝 Step 8: Update Appeal

### In Your Appeal:
- [ ] Mention name change (if applicable)
- [ ] Explain reason: "To avoid any potential trademark conflicts"
- [ ] Show you've been proactive
- [ ] Demonstrate compliance commitment

---

## 🎯 Quick Change Process

**If you choose a simple variation like "Balanze Finance":**

1. **Update strings** (5 minutes):
   - `android/app/src/main/res/values/strings.xml`
   - `index.html` title
   - `google_play_full_description.txt`

2. **Update key pages** (10 minutes):
   - Landing page header
   - Footer
   - Privacy Policy header
   - Terms of Service header

3. **Search & replace** (5 minutes):
   - Use IDE find/replace: "Balanze" → "Balanze Finance" (selective)

4. **Test** (10 minutes):
   - Build app
   - Verify display
   - Check for errors

**Total time**: ~30 minutes for basic change

---

## 💡 Pro Tips

1. **Keep it simple**: Adding "Finance" or "Money" is easiest
2. **Test first**: Build and test before submitting
3. **Be consistent**: Use same name everywhere
4. **Document changes**: Note what you changed
5. **Backup first**: Commit current code before changes

---

**Remember**: A name change is better than legal issues or rejection! 🚀

