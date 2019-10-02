module.exports = {
  clearMocks: true,
  preset: 'ts-jest',
  transform: {
    '.(js|jsx|ts|tsx)': '@sucrase/jest-plugin',
  },
}
