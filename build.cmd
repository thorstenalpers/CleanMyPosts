cd C:\Sources\CleanMyPosts\src\UI

REM dotnet clean ..\CleanMyPosts.sln
REM dotnet restore ..\CleanMyPosts.sln

REM dotnet build ..\CleanMyPosts.sln --configuration Release --no-restore

REM dotnet publish UI.csproj -c Release -r win-x64 --self-contained true

dotnet clean ..\CleanMyPosts.sln
REM dotnet publish ..\CleanMyPosts.sln -c Release -r win-x64 --self-contained true
dotnet publish ..\CleanMyPosts.sln -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -p:IncludeNativeLibrariesForSelfExtract=true -p:PublishTrimmed=false 

cd C:\Sources\CleanMyPosts\