

document.getElementById("uploadForm").addEventListener("submit", function (e) 
{
  e.preventDefault();
  const fileInput = document.getElementById("fileInput");
  const file = fileInput.files[0];
  const uploadBtn = document.getElementById("uploadBtn");

  if (!file) {
    showMessage("Please select a CSV file first.", "error");
    return;
  }

  // loader in button
  uploadBtn.disabled = true;
  uploadBtn.innerHTML = `<span class="loader"></span> Parsing...`;

  const reader = new FileReader();
  reader.onload = function (event) {
    setTimeout(() => { // simulate parsing delay
      const text = event.target.result;
      const rows = text.split("\n").map(r => r.split(","));

      // DB insert
      localStorage.setItem("csvData", JSON.stringify(rows));

      // Show success message
      showMessage(`File "${file.name}" uploaded and parsed successfully!`, "success");

      // Display table
      displayTable(rows);

      // Reset button
      uploadBtn.disabled = false;
      uploadBtn.innerHTML = "Upload File";
    }, 1000);
  };
  reader.readAsText(file);
});

function showMessage(msg, type) {
  const messageDiv = document.getElementById("message");
  messageDiv.innerText = msg;
  messageDiv.className = type; 
  messageDiv.style.display = "block";
}

function displayTable(data) {
  const output = document.getElementById("output");
  output.innerHTML = "<h3>Inserted Data:</h3>";
  let table = "<table><thead><tr>";

  // headers
  data[0].forEach(h => {
    table += `<th>${h}</th>`;
  });
  table += "</tr></thead><tbody>";

  // rows
  for (let i = 1; i < data.length; i++) {
    if (data[i].length === 1 && data[i][0] === "") continue;
    table += "<tr>";
    data[i].forEach(cell => {
      table += `<td>${cell}</td>`;
    });
    table += "</tr>";
  }
  table += "</tbody></table>";
  output.innerHTML += table;
}
