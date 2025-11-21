<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Group extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'owner_id',
        'member_ids',
        'image'
    ];

    /**
     * Get the owner of the group
     */
    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /**
     * Get the members of the group
     * Since member_ids is stored as comma-separated string, we need to convert it to array
     * Usage: $group->members()->get() or $group->members
     */
    public function members()
    {
        $memberIds = $this->getMemberIdsArray();
        
        if (empty($memberIds)) {
            return User::whereIn('id', [0]); // Return empty collection
        }
        
        return User::whereIn('id', $memberIds);
    }

    /**
     * Get member IDs as array from comma-separated string
     */
    public function getMemberIdsArray()
    {
        if (empty($this->member_ids)) {
            return [];
        }
        
        $ids = explode(',', $this->member_ids);
        return array_filter(array_map('trim', $ids));
    }
}
