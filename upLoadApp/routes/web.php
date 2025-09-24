<?php 

use App\Http\Controllers\RecordController;

Route::get('/', [RecordController::class, 'index']);
Route::get('/uploader', [RecordController::class, 'index'])->name('uploader');
Route::post('/uploader', [RecordController::class, 'upload'])->name('uploader.post');
