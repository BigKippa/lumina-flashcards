---
description: Saves/publishes changes to the production environment (main branch)
---
Here are the steps to merge beta to the main branch and save a production backup:

// turbo-all
1. Switch to the main branch: `git checkout main`
2. Merge the beta branch: `git merge beta`
3. Create a timestamped backup of the files in the 'Historical Prod' folder: `npm run backup:prod`
4. Push the changes to origin: `git push origin main`
5. Switch back to the beta branch: `git checkout beta`
