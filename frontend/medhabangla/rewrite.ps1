$content = Get-Content C:\Users\Admin\Documents\Bipul\schoolProject\schoolproject\frontend\medhabangla\src\App.tsx -Raw
$newImport = "import AcademicsDashboard from './pages/AcademicsDashboard';" + [Environment]::NewLine + "import StudyStats from './pages/StudyStats'"
$content = $content -replace "import StudyStats from './pages/StudyStats'", $newImport

$newRoute = "<Route path="/academics" element={<AcademicsDashboard />} />" + [Environment]::NewLine + "          <Route path="/tldraw" element={<TldrawPage />} />"
$content = $content -replace "<Route path="/tldraw" element={<TldrawPage />} />", $newRoute

Set-Content C:\Users\Admin\Documents\Bipul\schoolProject\schoolproject\frontend\medhabangla\src\App.tsx -Value $content