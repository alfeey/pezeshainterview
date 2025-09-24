<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pezesha CSV Upload</title>
  <link rel="stylesheet" href="{{ asset('style.css') }}">
</head>
<body>
  <div id="app" class="card">
    <h1>Data Upload</h1>
    <p>Upload your CSV document</p>

   

    <form action="{{ route('uploader.post') }}" method="POST" enctype="multipart/form-data">
      @csrf
      <input type="file" name="file" id="fileInput" accept=".csv" required>
      <button type="submit" id="uploadBtn">Upload File</button>
    </form>
     @if(session('success'))
      <div id="message" class="success">{{ session('success') }}</div>
    @endif
  </div>
</body>
</html>
