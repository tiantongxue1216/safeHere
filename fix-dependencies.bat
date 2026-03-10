@echo off
echo ========================================
echo 正在安装云函数依赖...
echo ========================================
echo.

echo [1/2] 正在为 createPost 安装依赖...
cd /d "%~dp0cloudfunctions\createPost"
call npm install
if %errorlevel% neq 0 (
    echo ❌ createPost 依赖安装失败！
    pause
    exit /b 1
)
echo ✅ createPost 依赖安装完成
echo.

echo [2/2] 正在为 createComment 安装依赖...
cd /d "%~dp0cloudfunctions\createComment"
call npm install
if %errorlevel% neq 0 (
    echo ❌ createComment 依赖安装失败！
    pause
    exit /b 1
)
echo ✅ createComment 依赖安装完成
echo.

echo ========================================
echo 所有依赖安装完成！
echo ========================================
echo.
echo 接下来请手动执行：
echo 1. 右键点击 cloudfunctions/createPost
echo 2. 选择"上传并部署：云端安装依赖"
echo 3. 同样步骤部署 createComment
echo.
pause
