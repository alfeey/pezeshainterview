<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RecordController extends Controller
{
    public function index()
    {
        return view('upload');
    }

    public function upload(Request $request)
    {
        $request->validate([
            'file' => 'required|mimes:csv,txt|max:4096',
        ]);

        $file = $request->file('file');
        $path = $file->getRealPath();

        $header = null;
        $rows = [];

        if (($handle = fopen($path, 'r')) !== false) {
            while (($row = fgetcsv($handle, 1000, ',')) !== false) {
                if (!$header) {
                    $header = $row; // first row == headers
                } else {
                    $rows[] = array_combine($header, $row);
                }
            }
            fclose($handle);
        }

        if (!empty($rows)) {
            DB::table('csv_data')->insert($rows);
        }

        return redirect()->back()->with('success', 'CSV uploaded and inserted successfully!');
    }
}
