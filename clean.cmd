@echo off
setlocal enabledelayedexpansion

taskkill /im dotnet.exe /f 


set "rootDir=C:\Sources\CleanMyPosts"
set "vsDir=%rootDir%\.vs"
set "testresultDir=%rootDir%\TestResults"

rd /s /q "%vsDir%"

rd /s /q "%testresultDir%"


:: Iterate over all subdirectories under %rootDir%
for /d /r "%rootDir%" %%a in (*) do (
    if /i "%%~nxa"=="bin" (
        call :DeleteBinObj "%%a" "bin"
    ) else if /i "%%~nxa"=="obj" (
        call :DeleteBinObj "%%a" "obj"
    )
)

echo Finished.
REM pause
exit /b

:DeleteBinObj
setlocal
set "currentDir=%~1"
set "skipDelete="

:: Check for .git, node_modules, or _archive in the current directory path
for %%b in ("%currentDir%") do (
    for %%c in (".git" "node_modules" "_archive") do (
        echo %%b | findstr /i "%%c" >nul
        if not errorlevel 1 (
            set "skipDelete=yes"
            goto :skipDeletion
        )
    )
)

:skipDeletion
if not defined skipDelete (
    if /i "%~2"=="bin" (
        echo Deleting folder: "%currentDir%"
        rd /s /q "%currentDir%"
    ) else if /i "%~2"=="obj" (
        echo Deleting folder: "%currentDir%"
        rd /s /q "%currentDir%"
    )
)

endlocal

