<?php

namespace App\Providers;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        try {
            DB::connection()->getPdo();

            if (! cache()->has('database.connection.confirmed')) {
                $driver = config('database.default');
                $label = $driver === 'pgsql' ? 'PostgreSQL' : strtoupper($driver);
                fwrite(\STDOUT, sprintf("✅ %s connected successfully.\n", $label));
                cache()->put('database.connection.confirmed', true, now()->addHour());
            }
        } catch (\Throwable $exception) {
            fwrite(\STDERR, sprintf("❌ Database connection failed: %s\n", $exception->getMessage()));
            // Do not re-throw: artisan commands (e.g. package:discover during composer
            // post-autoload-dump) must be able to run without a live DB connection.
        }
    }
}
