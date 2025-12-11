/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    // 下面这一行是关键！告诉它扫描当前目录下的所有 jsx 文件
    "./*.{js,ts,jsx,tsx}", 
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
