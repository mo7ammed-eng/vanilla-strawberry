<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\GalleryItem */
class GalleryItemResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'caption' => $this->caption,
            'image_url' => $this->image_url,
            'category' => $this->category,
            'sort_order' => $this->sort_order,
            'is_active' => $this->is_active,
        ];
    }
}
