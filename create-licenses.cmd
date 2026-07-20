echo ["Tests.csproj"] > exclude.json
dotnet-project-licenses -i src/CleanMyPosts.sln --projects-filter exclude.json -o --outfile THIRD_PARTY_LICENSES.txt
rm exclude.json
