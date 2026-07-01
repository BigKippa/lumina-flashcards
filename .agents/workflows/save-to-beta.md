---
description: Saves changes to the beta branch
---
Here are the steps to save the current progress to the beta branch with a timestamped backup:

// turbo-all
1. Add all changes to the staging area: `git add .`
2. Commit the changes. If no message is provided, use a default message: `git commit -m "Automated save to beta"`
3. Create a timestamped backup of the files in the 'Historical Beta' folder: `npm run backup`
4. Push the changes to the beta branch on origin: `git push origin beta`
