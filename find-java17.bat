@echo off
REM Script to find Java 17 installation and set JAVA_HOME

echo Searching for Java 17 installation...
echo.

REM Check common locations
echo Checking C:\Program Files\Eclipse Adoptium...
if exist "C:\Program Files\Eclipse Adoptium" (
    dir "C:\Program Files\Eclipse Adoptium" /b /ad | findstr /i "jdk-17"
)

echo.
echo Checking C:\Program Files\Java...
if exist "C:\Program Files\Java" (
    dir "C:\Program Files\Java" /b /ad | findstr /i "jdk-17"
)

echo.
echo Checking C:\Program Files (x86)\Java...
if exist "C:\Program Files (x86)\Java" (
    dir "C:\Program Files (x86)\Java" /b /ad | findstr /i "jdk-17"
)

echo.
echo ========================================
echo.
echo To find your Java 17 path, run:
echo   java -XshowSettings:properties -version 2^>^&1 ^| findstr "java.home"
echo.
echo Then set JAVA_HOME (replace with your actual path):
echo   set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.17+10-hotspot
echo.
echo Verify:
echo   echo %%JAVA_HOME%%
echo   java -version
echo.

