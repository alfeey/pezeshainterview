<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('csv_data', function (Blueprint $table) {
            $table->id();
            $table->string('InvoiceNo')->nullable();
            $table->string('StockCode')->nullable();
            $table->text('Description')->nullable();
            $table->integer('Quantity')->nullable();
            $table->string('InvoiceDate')->nullable(); 
            $table->decimal('UnitPrice', 8, 2)->nullable();
            $table->string('CustomerID')->nullable();
            $table->string('Country')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('csv_data');
    }
};
