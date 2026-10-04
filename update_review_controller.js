const fs = require('fs');

let controller = fs.readFileSync('services/review-service/src/controllers/review.controller.ts', 'utf8');

if (!controller.includes('customInstructions:')) {
  // Read it from req.body
  controller = controller.replace(
    'const { repoId, files, title, mode, pullRequestNumber, commitSha } = req.body;',
    'const { repoId, files, title, mode, customInstructions, pullRequestNumber, commitSha } = req.body;'
  );

  // Pass it to enqueueFileReview
  const enqueueTarget = `          await ReviewProducer.enqueueFileReview({
            reviewId: review.id,
            fileId: reviewFile.id,
            filePath: file.path,
            content: file.content,
            language: file.language || null,
            mode: mode || 'standard',
          });`;

  const enqueueReplacement = `          await ReviewProducer.enqueueFileReview({
            reviewId: review.id,
            fileId: reviewFile.id,
            filePath: file.path,
            content: file.content,
            language: file.language || null,
            mode: mode || 'standard',
            customInstructions: customInstructions || undefined,
          });`;
          
  controller = controller.replace(enqueueTarget, enqueueReplacement);
  fs.writeFileSync('services/review-service/src/controllers/review.controller.ts', controller);
}
