module.exports = {
  'src/**/*.ts': [
    'npm run pretty',
    'npm run lint',
    () => 'tsc --noEmit',
  ],
};
