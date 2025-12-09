# 🚀 PayPerPrompt Deployment Information

## 🌐 Live URLs

### Production
**Main URL**: https://mv-payperprompt.vercel.app/

### GitHub Repository
**Repo**: https://github.com/samarabdelhameed/mv-PayPerPrompt

---

## ✅ Deployment Status

- **Frontend**: ✅ Live on Vercel
- **Smart Contracts**: ✅ Ready for deployment
- **Status**: Production Ready

---

## 📊 Project Structure

```
PayPerPrompt/
├── web/                    ✅ Deployed on Vercel
├── contract/               ✅ Smart contracts ready
├── relay/                  ⏳ Backend service
├── analytics/              ⏳ Analytics dashboard
└── mobile/                 ⏳ Mobile apps
```

---

## 🔗 Quick Links

- **Live App**: https://mv-payperprompt.vercel.app/
- **GitHub**: https://github.com/samarabdelhameed/mv-PayPerPrompt
- **Vercel Dashboard**: https://vercel.com/dashboard

---

## 📝 Deployment Commands

### Frontend (Vercel)
```bash
# Auto-deploys on git push to main
git push origin main

# Manual deploy
vercel --prod
```

### Smart Contracts
```bash
cd contract
aptos move compile
aptos move publish --named-addresses PayPerPrompt=default
```

---

## ✅ Verification

Frontend is live and accessible at:
**https://mv-payperprompt.vercel.app/**

Last Updated: December 9, 2024
