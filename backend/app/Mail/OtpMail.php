<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class OtpMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public string $subjectLine, public string $body)
    {
    }

    public function build(): self
    {
        return $this->subject($this->subjectLine)
            ->html($this->body);
    }
}
